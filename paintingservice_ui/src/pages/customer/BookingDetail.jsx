import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  RefreshCw,
  Home,
  CreditCard,
  User,
  Phone,
  ShieldCheck,
  Calendar,
  Clock,
  FileSignature,
  Sparkles,
  Printer,
  Check,
  AlertTriangle,
  XCircle,
  Star,
} from "lucide-react";
import AxiosConfig from "../../util/AxiosConfig";
import StatusBadge from "../../components/common/StatusBadge";
import OrderStepper from "../../components/common/OrderStepper";
import OrderActionBanner from "../../components/common/OrderActionBanner";
import SurveyReportCard from "../../components/common/SurveyReportCard";
import ContractModal from "../../components/common/ContractModal";
import ImageLightboxModal from "../../components/common/ImageLightboxModal";
import PaymentSection from "../../components/payment/PaymentSection";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import RejectQuoteModal from "../../components/common/RejectQuoteModal";
import ReviewModal from "../../components/review/ReviewModal";
import ReviewCard from "../../components/review/ReviewCard";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { formatMoney } from "../../util/formatters";
import { formatDate, parseImageUrls } from "../../util/orderFlowUtils";
import { exportContractPDF } from "../../util/contractPdfExport";

export default function BookingDetail(props) {
  const outletCtx = useOutletContext() || {};
  const user = props.user || outletCtx.user;
  const showToast = props.showToast || outletCtx.showToast;
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [contract, setContract] = useState(null);
  const [dailyReports, setDailyReports] = useState([]);
  const [bookingDetails, setBookingDetails] = useState([]);
  const [review, setReview] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [contractModal, setContractModal] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [selectedStartDate, setSelectedStartDate] = useState("");
  const [acceptingQuote, setAcceptingQuote] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const fetchBooking = async () => {
    try {
      const response = await AxiosConfig.get(`/bookings/${id}`);
      setBooking(response.data);
      if (response.data?.expectedStartDate) {
        setSelectedStartDate(response.data.expectedStartDate);
      } else {
        const tmrw = new Date(Date.now() + 86400000).toISOString().split("T")[0];
        setSelectedStartDate(tmrw);
      }
    } catch (error) {
      console.error("Load booking detail error:", error);
      showToast?.("Không tải được thông tin đơn hàng!", "error");
    }
  };

  const fetchContract = async () => {
    try {
      const response = await AxiosConfig.get("/contracts");
      const contracts = Array.isArray(response.data) ? response.data : [];
      const found = contracts.find((item) => Number(item.bookingId) === Number(id));
      setContract(found || null);
    } catch (error) {
      console.error("Load contract error:", error);
      setContract(null);
    }
  };

  const fetchDailyReports = async () => {
    try {
      const response = await AxiosConfig.get(`/daily-reports/booking/${id}`);
      setDailyReports(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setDailyReports([]);
    }
  };

  const fetchBookingDetails = async () => {
    try {
      const response = await AxiosConfig.get(`/booking-details/booking/${id}`);
      setBookingDetails(Array.isArray(response.data) ? response.data : []);
    } catch (e) {
      setBookingDetails([]);
    }
  };

  const fetchReview = async () => {
    try {
      const response = await AxiosConfig.get(`/reviews/booking/${id}`);
      setReview(response.data || null);
    } catch (e) {
      setReview(null);
    }
  };

  const refreshData = async () => {
    await Promise.all([
      fetchBooking(),
      fetchContract(),
      fetchDailyReports(),
      fetchBookingDetails(),
      fetchReview(),
    ]);
  };


  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    const load = async () => {
      setLoading(true);
      await refreshData();
      setLoading(false);
    };
    load();
  }, [id, user]);

  // Đồng ý báo giá, lưu ngày bắt đầu và mở modal ký hợp đồng
  const handleAcceptQuoteAndOpenContract = async () => {
    if (!selectedStartDate) {
      showToast?.("Vui lòng chọn ngày bắt đầu thi công mong muốn!", "warning");
      return;
    }
    const today = new Date().toISOString().split("T")[0];
    const maxDate = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
    if (selectedStartDate < today) {
      showToast?.("Ngày bắt đầu thi công không thể là ngày trong quá khứ!", "error");
      return;
    }
    if (selectedStartDate > maxDate) {
      showToast?.("Ngày thi công tối đa trong vòng 30 ngày kể từ hôm nay!", "warning");
      return;
    }

    try {
      setAcceptingQuote(true);
      await AxiosConfig.put(`/bookings/${id}`, {
        ...booking,
        expectedStartDate: selectedStartDate,
      });
      setContractModal(true);
    } catch (error) {
      showToast?.(error.response?.data?.message || "Không thể cập nhật ngày thi công!", "error");
    } finally {
      setAcceptingQuote(false);
    }
  };

  // Xác nhận nghiệm thu
  const handleCustomerAccept = () => {
    setConfirmDialog({
      title: "Xác nhận Nghiệm Thu Công Trình",
      message:
        "Bạn xác nhận công trình đã được thi công hoàn thiện đạt yêu cầu chất lượng?\n\nSau khi nghiệm thu, bạn có thể tiến hành thanh toán phần tất toán còn lại (70%) qua VNPay Sandbox.",
      onConfirm: async () => {
        try {
          try {
            const res = await AxiosConfig.get(`/booking-details/booking/${id}`);
            const details = Array.isArray(res.data) ? res.data : [];
            const pending = details.filter((d) => !d.customerAccepted);
            if (pending.length > 0) {
              await Promise.all(
                pending.map((d) => AxiosConfig.post(`/booking-details/${d.id}/customer-accept`))
              );
            }
          } catch (e) {
            // ignore
          }

          await AxiosConfig.put(`/bookings/${id}`, {
            ...booking,
            customerAccepted: true,
            status: "WAITING_FINAL_PAYMENT",
          });

          showToast?.("Nghiệm thu công trình thành công! Đã chuyển sang trạng thái chờ tất toán 70%.", "success");
          await refreshData();
        } catch (error) {
          showToast?.(error.response?.data?.message || "Không thể nghiệm thu công trình!", "error");
        } finally {
          setConfirmDialog(null);
        }
      },
    });
  };

  // Từ chối báo giá
  const handleRejectQuote = async (reason) => {
    try {
      setRejecting(true);
      await AxiosConfig.post(`/bookings/${id}/reject-quote`, { reason });
      showToast?.("Đã từ chối báo giá và hủy yêu cầu thành công!", "success");
      setRejectModalOpen(false);
      await refreshData();
    } catch (error) {
      showToast?.(error.response?.data?.message || "Không thể từ chối báo giá!", "error");
    } finally {
      setRejecting(false);
    }
  };

  // Xóa đánh giá
  const handleDeleteReview = () => {
    if (!review) return;
    setConfirmDialog({
      title: "Xác nhận xóa đánh giá",
      message: "Bạn có chắc chắn muốn xóa bài đánh giá & góp ý này không?",
      onConfirm: async () => {
        try {
          await AxiosConfig.delete(`/reviews/${review.id}`);
          showToast?.("Đã xóa đánh giá thành công!", "success");
          await fetchReview();
        } catch (error) {
          showToast?.(error.response?.data?.message || "Không thể xóa đánh giá!", "error");
        } finally {
          setConfirmDialog(null);
        }
      },
    });
  };

  // Xử lý các hành động từ Banner
  const handleBannerAction = async (actionType) => {
    if (actionType === "reject_quote") {
      setRejectModalOpen(true);
    } else if (actionType === "open_contract") {
      setContractModal(true);
    } else if (actionType === "open_review") {
      setReviewModalOpen(true);
    } else if (actionType === "pay_deposit") {
      try {
        const res = await AxiosConfig.post(`/payments/vnpay/create?bookingId=${booking.id}&paymentType=DEPOSIT`);
        if (res.data?.paymentUrl) window.location.href = res.data.paymentUrl;
      } catch (e) {
        showToast?.(e.response?.data?.message || "Lỗi tạo link VNPay", "error");
      }
    } else if (actionType === "pay_final") {
      try {
        const res = await AxiosConfig.post(`/payments/vnpay/create?bookingId=${booking.id}&paymentType=FINAL`);
        if (res.data?.paymentUrl) window.location.href = res.data.paymentUrl;
      } catch (e) {
        showToast?.(e.response?.data?.message || "Lỗi tạo link VNPay", "error");
      }
    } else if (actionType === "customer_accept") {
      handleCustomerAccept();
    } else if (actionType === "export_pdf") {
      if (contract) {
        exportContractPDF(contract, booking);
        showToast?.("Đã tải xuống file PDF hợp đồng thành công!", "success");
      } else {
        showToast?.("Chưa có hợp đồng để xuất file PDF!", "warning");
      }
    }
  };


  if (loading) return <LoadingSpinner />;

  if (!booking) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-sm w-full">
          <div className="text-4xl mb-3">📋</div>
          <h2 className="font-bold text-slate-800 text-base">Không tìm thấy đơn hàng #{id}</h2>
          <button
            type="button"
            onClick={() => navigate("/customer/ongoing")}
            className="mt-4 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold cursor-pointer"
          >
            Về Quản lý yêu cầu
          </button>
        </div>
      </div>
    );
  }

  const canAcceptQuote =
    ["WAITING_CUSTOMER_SIGNATURE", "WAITING_ADMIN_QUOTE", "CUSTOMER_ACCEPTED_QUOTE"].includes(booking.status) &&
    Number(booking.totalAmount) > 0 &&
    (!contract || !contract.customerSigned);
  const surveyDetail = bookingDetails && bookingDetails.length > 0 ? bookingDetails[0] : null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/customer/ongoing")}
            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 font-bold transition cursor-pointer shrink-0"
            title="Quay lại danh sách yêu cầu"
          >
            <ArrowLeft className="w-4 h-4 text-slate-700" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900">Chi tiết đơn #{booking.id}</h1>
              <StatusBadge status={booking.status} />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Tạo ngày {formatDate(booking.createdAt || booking.appointmentDate)} • Dịch vụ:{" "}
              <span className="font-bold text-slate-700">{booking.serviceName || booking.service?.name || "Sơn sửa nhà"}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {contract && (
            <button
              type="button"
              onClick={() => setContractModal(true)}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <FileText className="w-3.5 h-3.5 text-white" />
              <span>{contract.customerSigned ? "Xem Hợp Đồng" : "Ký Hợp Đồng"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={refreshData}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition cursor-pointer"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>

      {/* 6-Stage Progress Stepper */}
      <OrderStepper status={booking.status} />

      {/* Hero Action Guidance Banner */}
      <OrderActionBanner
        role="customer"
        booking={booking}
        contract={contract}
        review={review}
        canAcceptQuote={canAcceptQuote}
        onAction={handleBannerAction}
      />


      {/* Cảnh báo nếu đơn đã hủy */}
      {booking.status === "CANCELLED" && (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-5 sm:p-6 shadow-xs flex items-start gap-4 text-rose-900">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          </div>
          <div className="space-y-1 flex-1">
            <h3 className="text-sm font-bold text-rose-950 uppercase tracking-wider">
              Đơn hàng này đã bị hủy / Từ chối báo giá
            </h3>
            <p className="text-xs text-rose-800 leading-relaxed">
              Yêu cầu dịch vụ này đã kết thúc. Chi tiết lý do được ghi nhận trong phần mô tả bên dưới. Nếu bạn cần khảo sát lại hoặc đặt dịch vụ mới, vui lòng liên hệ tổng đài 1900 6868 hoặc đăng ký yêu cầu mới.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: 2 Cột chi tiết */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột trái 2 phần: Thông tin, Khảo sát, Báo giá, Nhật ký thi công */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Thông tin công trình & Khảo sát */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Home className="w-4 h-4 text-slate-700" />
              <span>Thông tin công trình &amp; Khảo sát</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <span className="text-slate-400 font-bold block mb-1">Địa chỉ công trình (Hà Nội)</span>
                <span className="text-slate-800 font-bold text-sm leading-snug">
                  {booking.address || "Chưa có địa chỉ"}
                </span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <span className="text-slate-400 font-bold block mb-1">Thời gian hẹn khảo sát</span>
                <span className="text-slate-800 font-bold text-sm">
                  {formatDate(booking.appointmentDate)} • {booking.appointmentTime || "08:00"}
                </span>
              </div>
            </div>

            {booking.description && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
                <span className="text-slate-400 font-bold block mb-1">Yêu cầu &amp; Mô tả hiện trạng của bạn:</span>
                <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{booking.description}</p>
              </div>
            )}

            {/* Báo cáo khảo sát thực tế từ Giám sát viên */}
            <SurveyReportCard
              surveyDetail={surveyDetail}
              supervisorName={booking.supervisorName}
              onPreviewImage={setPreviewImage}
            />
          </div>

          {/* Card 2: Báo giá, Dự toán & Chọn ngày thi công */}
          {Number(booking.totalAmount) > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>Báo giá dịch vụ &amp; Dự toán thi công</span>
                </h3>
                {canAcceptQuote ? (
                  <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                    Chờ bạn chọn ngày &amp; ký HĐ
                  </span>
                ) : (
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Đã duyệt báo giá
                  </span>
                )}
              </div>

              <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <div className="text-slate-500 font-semibold">Tổng chi phí thi công</div>
                    <div className="text-2xl font-black text-slate-900 mt-0.5">{formatMoney(booking.totalAmount)}</div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Đặt cọc 30%: <strong className="text-emerald-700">{formatMoney(booking.depositAmount || Number(booking.totalAmount) * 0.3)}</strong>
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-500 font-semibold">Thời gian thi công dự kiến</div>
                    <div className="text-xl font-black text-slate-800 mt-0.5 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      <span>{booking.estimatedDays || 3} ngày làm việc</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Còn lại 70%: <strong className="text-slate-700">{formatMoney(booking.remainingAmount || Number(booking.totalAmount) * 0.7)}</strong>
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-500 font-semibold">Chế độ bảo hành</div>
                    <div className="text-xl font-black text-emerald-700 mt-0.5 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>{booking.warrantyYears || 2} năm bảo hành</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">Cam kết sơn chính hãng 100%</div>
                  </div>
                </div>

                {canAcceptQuote && (
                  <div className="pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div className="space-y-1.5 flex-1 max-w-sm">
                      <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Chọn ngày bắt đầu thi công mong muốn <span className="text-rose-500">*</span></span>
                      </label>
                      <input
                        type="date"
                        min={new Date().toISOString().split("T")[0]}
                        max={new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]}
                        value={selectedStartDate}
                        onChange={(e) => setSelectedStartDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 shadow-xs"
                      />
                      <p className="text-[10.5px] text-slate-400">* Bạn có thể chọn ngày làm trong vòng 30 ngày tới.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setRejectModalOpen(true)}
                        disabled={acceptingQuote || rejecting}
                        className="px-4 py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition border border-rose-200 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4 text-rose-600" />
                        <span>✕ Từ chối báo giá</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleAcceptQuoteAndOpenContract}
                        disabled={acceptingQuote || !selectedStartDate || rejecting}
                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs transition shadow-xs cursor-pointer shrink-0 flex items-center justify-center gap-2"
                      >
                        <FileSignature className="w-4 h-4 text-white" />
                        <span>{acceptingQuote ? "Đang xử lý..." : "✓ Đồng ý Báo Giá & Ký Hợp Đồng"}</span>
                      </button>
                    </div>
                  </div>
                )}

                {!canAcceptQuote && booking.expectedStartDate && (
                  <div className="pt-3 border-t border-slate-200/80 flex items-center gap-2 text-xs text-slate-700">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span>Ngày bắt đầu thi công đã cam kết: <strong className="text-slate-900">{formatDate(booking.expectedStartDate)}</strong></span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Card 3: Thanh toán Cọc & Tất toán */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-slate-700" />
              <span>Thanh toán tiền cọc &amp; Tất toán</span>
            </h3>

            <PaymentSection
              booking={booking}
              contract={contract}
              onOpenContract={() => setContractModal(true)}
              showToast={showToast}
              onRefresh={refreshData}
            />
          </div>

          {/* Card 4: Nhật ký thi công hàng ngày */}
          {(dailyReports.length > 0 || ["ASSIGNED", "PROCESSING", "WORKER_COMPLETED", "COMPLETED", "PAID_TO_STAFF"].includes(booking.status)) && (
            <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Nhật Ký &amp; Tiến Độ Thi Công Hàng Ngày
                  </h3>
                </div>
                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  {dailyReports.length} báo cáo
                </span>
              </div>

              {dailyReports.length === 0 ? (
                <div className="p-6 bg-slate-50 rounded-2xl text-center text-xs text-slate-500 border border-slate-200/80">
                  ⏳ Đội thợ đang chuẩn bị thi công. Nhật ký hình ảnh và tiến độ % hàng ngày sẽ được cập nhật tại đây.
                </div>
              ) : (
                <div className="space-y-4">
                  {dailyReports.map((report, idx) => {
                    const imgs = parseImageUrls(report.progressImages);
                    return (
                      <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-xs">
                            Ngày {formatDate(report.createdAt || report.reportDate)}
                          </span>
                          {report.progressPercentage != null && (
                            <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                              {report.progressPercentage}% hoàn thành
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-700 leading-relaxed font-medium">
                          {report.content || report.description || "Đang thi công sơn sửa theo kế hoạch."}
                        </p>

                        {imgs.length > 0 && (
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 pt-1">
                            {imgs.map((imgUrl, imgIdx) => (
                              <div
                                key={imgIdx}
                                onClick={() => setPreviewImage(imgUrl)}
                                className="aspect-square rounded-xl overflow-hidden border border-slate-200 bg-white hover:scale-105 transition cursor-pointer group relative"
                              >
                                <img src={imgUrl} alt="Tiến độ" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-bold">
                                  🔍 Xem
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          {/* Card 5: Đánh Giá & Góp Ý Cho Đội Thợ */}
          {(["COMPLETED", "PAID_TO_STAFF"].includes(booking.status) || booking.paymentStatus === "FULLY_PAID") && (
            <div>
              {review ? (
                <ReviewCard
                  review={review}
                  onEdit={() => setReviewModalOpen(true)}
                  onDelete={handleDeleteReview}
                />
              ) : (
                <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-md border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative overflow-hidden">
                  <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex items-start gap-4 z-10">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-2xl shrink-0 border border-emerald-400/20">
                      ⭐
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/30 text-emerald-200 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                          Chia sẻ trải nghiệm
                        </span>
                        <span className="text-xs text-emerald-300 font-bold">1 phút gửi đánh giá</span>
                      </div>
                      <h3 className="text-base font-bold text-white">
                        Đánh giá chất lượng thi công &amp; Góp ý cho Đội thợ
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                        Công trình đã hoàn tất nghiệm thu! Mời bạn chấm điểm sao và gửi góp ý để giúp đội thợ ngày càng hoàn thiện tay nghề và phục vụ tốt hơn.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReviewModalOpen(true)}
                    className="w-full sm:w-auto px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl text-xs transition shrink-0 shadow-lg flex items-center justify-center gap-2 cursor-pointer z-10 hover:scale-105 duration-150"
                  >
                    <Star className="w-4 h-4 fill-slate-950 text-slate-950" />
                    <span>Đánh Giá Thợ Ngay</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cột phải 1 phần: Nhân sự phụ trách & Thẻ Hợp đồng */}
        <div className="space-y-6">
          {/* Nhân sự phụ trách */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600" />
              <span>Đội Ngũ Phụ Trách Công Trình</span>
            </h3>

            <div className="space-y-3 text-xs">
              {/* Giám sát viên */}
              <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-1.5">
                <span className="text-[10.5px] font-bold uppercase text-blue-800 block">
                  Giám sát viên khảo sát
                </span>
                <div className="font-black text-slate-900 text-sm">
                  {booking.supervisorName || booking.surveyorName ? `@${booking.supervisorName || booking.surveyorName}` : "Đang sắp xếp..."}
                </div>
                {booking.supervisorPhone && (
                  <a
                    href={`tel:${booking.supervisorPhone}`}
                    className="inline-flex items-center gap-1.5 text-blue-700 font-bold hover:underline pt-0.5"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{booking.supervisorPhone}</span>
                  </a>
                )}
              </div>

              {/* Đội thợ sơn */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-1.5">
                <span className="text-[10.5px] font-bold uppercase text-emerald-800 block">
                  Đội thợ thi công
                </span>
                <div className="font-black text-slate-900 text-sm">
                  {booking.technicianName ? `@${booking.technicianName}` : "Sẽ gán sau khi cọc 30%"}
                </div>
                {booking.technicianPhone && (
                  <a
                    href={`tel:${booking.technicianPhone}`}
                    className="inline-flex items-center gap-1.5 text-emerald-700 font-bold hover:underline pt-0.5"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{booking.technicianPhone}</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Thẻ tóm tắt Hợp đồng điện tử */}
          {contract && (
            <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-3 text-xs">
              <h3 className="font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileSignature className="w-4 h-4 text-emerald-600" />
                <span>Hợp Đồng Điện Tử</span>
              </h3>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
                <div className="text-slate-500">
                  Mã HĐ: <strong className="text-slate-900">{contract.contractCode || `HD-${booking.id}`}</strong>
                </div>
                <div className="text-slate-500">
                  Khách hàng: <strong className={contract.customerSigned ? "text-emerald-700" : "text-amber-600"}>
                    {contract.customerSigned ? "✓ Đã ký" : "Chưa ký"}
                  </strong>
                </div>
                <div className="text-slate-500">
                  Admin phê duyệt: <strong className={contract.adminSigned ? "text-emerald-700" : "text-slate-400"}>
                    {contract.adminSigned ? "✓ Đã duyệt" : "Chờ cọc"}
                  </strong>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setContractModal(true)}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{contract.customerSigned ? "Xem Chi Tiết Hợp Đồng" : "Ký Hợp Đồng Ngay"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    exportContractPDF(contract, booking);
                    showToast?.("Đã tải xuống file PDF hợp đồng thành công!", "success");
                  }}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Xuất File PDF / In Hợp Đồng</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Shared Modals */}
      <ReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        booking={booking}
        existingReview={review}
        showToast={showToast}
        onSuccess={fetchReview}
      />

      <ContractModal
        isOpen={contractModal}
        onClose={() => setContractModal(false)}
        contract={contract}
        booking={booking}
        role="customer"
        showToast={showToast}
        onSuccess={refreshData}
        onRejectQuote={() => setRejectModalOpen(true)}
      />

      <RejectQuoteModal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        booking={booking}
        onConfirmReject={handleRejectQuote}
        loading={rejecting}
      />

      <ImageLightboxModal imageUrl={previewImage} onClose={() => setPreviewImage(null)} />

      <ConfirmDialog
        isOpen={Boolean(confirmDialog)}
        onClose={() => setConfirmDialog(null)}
        onConfirm={() => confirmDialog?.onConfirm?.()}
        title={confirmDialog?.title}
        message={confirmDialog?.message}
      />
    </div>
  );
}

