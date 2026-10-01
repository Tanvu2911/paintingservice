import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  RefreshCw,
  CreditCard,
  User,
  Phone,
  ShieldCheck,
  Calendar,
  Clock,
  FileSignature,
  Printer,
  Check,
  AlertTriangle,
  Star,
  ShieldAlert,
  Paintbrush,
  CheckCircle2,
  Trash2,
  Layers,
  Info,
  MapPin,
} from "lucide-react";
import AxiosConfig from "../../util/AxiosConfig";
import StatusBadge from "../../components/common/StatusBadge";
import OrderStepper from "../../components/common/OrderStepper";
import SurveyReportCard from "../../components/common/SurveyReportCard";
import ContractModal from "../../components/common/ContractModal";
import ImageLightboxModal from "../../components/common/ImageLightboxModal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import ReviewModal from "../../components/review/ReviewModal";
import ReviewCard from "../../components/review/ReviewCard";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import StaffDetailModal from "../../components/common/StaffDetailModal";
import QuoteResponseModal from "../../components/common/QuoteResponseModal";
import WarrantyClaimModal from "../../components/common/WarrantyClaimModal";
import WarrantyClaimList from "../../components/common/WarrantyClaimList";
import { formatMoney } from "../../util/formatters";
import { formatDate, parseImageUrls, parseNegotiationInfo } from "../../util/orderFlowUtils";
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

  // Tabs: 'overview' | 'contract_quote' | 'reports' | 'warranty_review'
  const [activeTab, setActiveTab] = useState("overview");

  const [contractModal, setContractModal] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [, setSelectedStartDate] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedStaffProfile, setSelectedStaffProfile] = useState(null);
  const [quoteResponseModalOpen, setQuoteResponseModalOpen] = useState(false);
  const [warrantyClaims, setWarrantyClaims] = useState([]);
  const [warrantyModalOpen, setWarrantyModalOpen] = useState(false);

  const hasActiveWarrantyClaim = useMemo(() => {
    return warrantyClaims.some(
      (c) => !["COMPLETED", "REJECTED", "CANCELLED"].includes(c.status)
    );
  }, [warrantyClaims]);

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

  const fetchWarrantyClaims = async () => {
    try {
      const response = await AxiosConfig.get(`/warranty-claims/booking/${id}`);
      setWarrantyClaims(Array.isArray(response.data) ? response.data : []);
    } catch (e) {
      setWarrantyClaims([]);
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
      fetchWarrantyClaims(),
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

  // Nghiệm thu công trình
  const handleCustomerAccept = () => {
    setConfirmDialog({
      title: "Xác nhận Nghiệm Thu Công Trình",
      message:
        "Bạn xác nhận công trình đã được thi công hoàn thiện đạt yêu cầu chất lượng?\n\nSau khi nghiệm thu, bạn có thể tiến hành thanh toán phần tất toán còn lại (70%) qua VNPay.",
      onConfirm: async () => {
        try {
          await AxiosConfig.post(`/bookings/${id}/customer-accept`);
          showToast?.("Nghiệm thu công trình thành công! Chuyển sang bước tất toán 70%.", "success");
          await refreshData();
        } catch (error) {
          showToast?.(error.response?.data?.message || "Không thể nghiệm thu công trình!", "error");
        } finally {
          setConfirmDialog(null);
        }
      },
    });
  };

  // Thương lượng giá
  const handleNegotiateQuote = async (proposedPrice, message) => {
    try {
      const rawDesc = booking?.description || "";
      const negInfo = parseNegotiationInfo(rawDesc);
      const initialDescription = negInfo.initialDesc || "";
      const existingHistoryMatch = rawDesc.match(/\[Lịch sử thương lượng:([\s\S]*?)\]/i);
      const historyBlock = existingHistoryMatch ? `\n${existingHistoryMatch[0]}` : "";

      const priceNote = proposedPrice ? ` (Giá đề xuất: ${Number(proposedPrice).toLocaleString("vi-VN")}đ)` : "";
      const negotiationPrefix = `[Đề xuất thương lượng giá${priceNote}]`;
      const initialBlock = initialDescription ? `\n\n[Mô tả ban đầu:\n${initialDescription}\n]` : "";
      const newDescription = `${negotiationPrefix} ${message}${historyBlock}${initialBlock}`;

      await AxiosConfig.put(`/bookings/${id}`, {
        ...booking,
        description: newDescription,
      });
      showToast?.("Đề xuất thương lượng đã được gửi tới Admin! Quản trị viên sẽ phản hồi sớm.", "success");
      await refreshData();
    } catch (error) {
      showToast?.(error.response?.data?.message || "Không thể gửi đề xuất thương lượng!", "error");
    }
  };

  // Hủy đề xuất thương lượng giá
  const handleCancelNegotiation = async () => {
    try {
      const rawDesc = booking?.description || "";
      const negInfo = parseNegotiationInfo(rawDesc);
      const initialDescription = negInfo.initialDesc || "";
      const existingHistoryMatch = rawDesc.match(/\[Lịch sử thương lượng:([\s\S]*?)\]/i);
      const historyBlock = existingHistoryMatch ? `${existingHistoryMatch[0]}\n\n` : "";
      const initialBlock = initialDescription ? `[Mô tả ban đầu:\n${initialDescription}\n]` : "";
      const newDescription = (historyBlock + initialBlock).trim();

      await AxiosConfig.put(`/bookings/${id}`, {
        ...booking,
        description: newDescription || null,
      });
      showToast?.("Đã hủy đề xuất thương lượng giá thành công!", "success");
      setQuoteResponseModalOpen(false);
      await refreshData();
    } catch (error) {
      showToast?.(error.response?.data?.message || "Không thể hủy yêu cầu thương lượng!", "error");
    }
  };

  // Hủy một gói dịch vụ đã đăng ký (luôn gọi endpoint reject - backend xử lý hủy đơn khi hết gói)
  const handleCancelServiceItem = (item) => {
    const services = booking?.bookingServices || [];
    // Chỉ đếm các gói chưa bị hủy
    const activeServices = services.filter((s) => !s.cancelled);
    const isOnlyOneService = activeServices.length <= 1;
    const sName = item?.serviceName || "Gói dịch vụ";
    const itemPriceText = item?.price && Number(item.price) > 0 ? ` (${formatMoney(item.price)})` : "";

    setConfirmDialog({
      title: isOnlyOneService ? "Xác nhận hủy đơn hàng" : "Xác nhận hủy gói dịch vụ",
      message: isOnlyOneService
        ? `Đây là gói dịch vụ duy nhất trong công trình ("${sName}"). Hủy gói này đồng nghĩa với việc hủy toàn bộ đơn hàng. Bạn có chắc chắn muốn hủy không?`
        : `Bạn có chắc chắn muốn hủy gói "${sName}"${itemPriceText} khỏi công trình? Tổng dự toán và tiền cọc sẽ được tính lại tự động cho các dịch vụ còn lại.`,
      onConfirm: async () => {
        try {
          await AxiosConfig.post(`/bookings/${id}/services/${item.id}/reject`);
          showToast?.(
            isOnlyOneService
              ? "Đã hủy đơn hàng thành công!"
              : `Đã hủy gói "${sName}" khỏi công trình thành công!`,
            "success"
          );
          setConfirmDialog(null);
          await refreshData();
        } catch (error) {
          showToast?.(error.response?.data?.message || "Không thể hủy gói dịch vụ!", "error");
        }
      },
    });
  };

  // Xóa đánh giá
  const handleDeleteReview = () => {
    if (!review) return;
    setConfirmDialog({
      title: "Xác nhận xóa đánh giá",
      message: "Bạn có chắc chắn muốn xóa bài đánh giá này không?",
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

  // Xử lý các hành động
  const handleBannerAction = async (actionType) => {
    if (actionType === "cancel_survey") {
      setConfirmDialog({
        title: "Xác nhận hủy yêu cầu khảo sát",
        message: "Bạn có chắc chắn muốn hủy yêu cầu khảo sát này không?",
        onConfirm: async () => {
          try {
            await AxiosConfig.post(`/bookings/${id}/cancel-survey`, {
              reason: "Khách hàng hủy yêu cầu khảo sát",
            });
            showToast?.("Đã hủy yêu cầu khảo sát thành công!", "success");
            await refreshData();
          } catch (error) {
            showToast?.(error.response?.data?.message || "Không thể hủy yêu cầu khảo sát!", "error");
          } finally {
            setConfirmDialog(null);
          }
        },
      });
    } else if (actionType === "respond_quote") {
      setQuoteResponseModalOpen(true);
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
        showToast?.("Đã xuất file PDF hợp đồng thành công!", "success");
      } else {
        showToast?.("Chưa có hợp đồng để xuất PDF!", "warning");
      }
    }
  };

  // Xem thông tin chi tiết nhân sự (Giám sát / Thợ)
  const handleOpenStaffModal = async (type, staffItem = null) => {
    const isSupervisor = type === "supervisor";
    const userId = isSupervisor
      ? (booking.supervisorId || booking.surveyorId)
      : (staffItem?.technicianId || booking.technicianId || booking.preferredTechnicianId);
    const username = isSupervisor
      ? (booking.supervisorName || booking.surveyorName)
      : (staffItem?.technicianName || booking.technicianName || booking.preferredTechnicianName);
    const phone = isSupervisor
      ? booking.supervisorPhone
      : (staffItem?.technicianPhone || booking.technicianPhone || booking.preferredTechnicianPhone);
    const avatar = isSupervisor
      ? (booking.supervisorAvatar || booking.surveyorAvatar)
      : (staffItem?.technicianAvatar || booking.technicianAvatar || booking.preferredTechnicianAvatar);

    if (!userId && !username) {
      showToast?.("Chưa có nhân sự được phân công cho vị trí này!", "info");
      return;
    }

    try {
      if (userId) {
        const res = await AxiosConfig.get(`/staff/by-user/${userId}`);
        if (res.data) {
          setSelectedStaffProfile(res.data);
          return;
        }
      }
    } catch (e) {
      console.warn("Could not fetch full staff profile", e);
    }

    setSelectedStaffProfile({
      username: username || "Nhân viên",
      fullName: username || "Nhân sự phụ trách",
      phoneNumber: phone || "",
      avatar: avatar || "",
      staffType: isSupervisor ? "SUPERVISOR" : "WORKER",
      specialty: isSupervisor ? "Giám sát & Khảo sát công trình" : "Thi công sơn sửa nhà",
      experienceYears: isSupervisor ? 5 : 3,
      rating: 5.0,
      serviceArea: "Hà Nội",
    });
  };

  if (loading) return <LoadingSpinner message="Đang tải dữ liệu công trình..." />;

  if (!booking) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-4">
        <div className="text-center bg-white p-7 rounded-2xl border border-slate-200 shadow-2xs max-w-sm w-full">
          <div className="text-3xl mb-2">📋</div>
          <h2 className="font-bold text-slate-800 text-sm">Không tìm thấy công trình #{id}</h2>
          <button
            type="button"
            onClick={() => navigate("/customer/ongoing")}
            className="mt-4 px-4 py-2 rounded-xl bg-[#1E3A8A] text-white text-xs font-bold cursor-pointer"
          >
            Về danh sách công trình
          </button>
        </div>
      </div>
    );
  }

  const total = Number(booking.totalAmount) || 0;
  const deposit = booking.depositAmount ? Number(booking.depositAmount) : total * 0.3;
  const remaining = Math.max(0, total - deposit);
  const isDepositPaid = Boolean(
    booking.depositPaid ||
    booking.paymentStatus === "DEPOSIT_PAID" ||
    booking.paymentStatus === "FULLY_PAID" ||
    ["DEPOSIT_CONFIRMED", "ASSIGNED", "PROCESSING", "WORKER_COMPLETED", "WAITING_FINAL_PAYMENT", "COMPLETED", "PAID_TO_STAFF"].includes(booking.status)
  );
  const isFinalPaid = Boolean(
    booking.finalPaid ||
    booking.paymentStatus === "FULLY_PAID" ||
    ["COMPLETED", "PAID_TO_STAFF"].includes(booking.status)
  );
  const isAccepted = Boolean(
    booking.customerAccepted ||
    ["WAITING_FINAL_PAYMENT", "COMPLETED", "PAID_TO_STAFF"].includes(booking.status)
  );
  const isWorkerCompleted = Boolean(booking.status === "WORKER_COMPLETED");
  const needsAcceptance = isWorkerCompleted && !isAccepted;
  const needsFinalPayment = isAccepted && !isFinalPaid;
  const isAllCompleted = isAccepted && isFinalPaid;

  const canAcceptQuote =
    ["WAITING_CUSTOMER_SIGNATURE", "WAITING_ADMIN_QUOTE", "CUSTOMER_ACCEPTED_QUOTE"].includes(booking.status) &&
    total > 0 &&
    (!contract || !contract.customerSigned);

  const canCancelServices =
    !isDepositPaid &&
    ["PENDING", "SURVEY_ASSIGNED", "SURVEYING", "ACCEPTED", "WAITING_CUSTOMER_SIGNATURE", "WAITING_ADMIN_QUOTE", "WAITING_CUSTOMER_QUOTE_APPROVAL", "CUSTOMER_ACCEPTED_QUOTE", "WAITING_DEPOSIT"].includes(booking.status) &&
    (!contract || !contract.customerSigned);

  const surveyDetail = bookingDetails && bookingDetails.length > 0 ? bookingDetails[0] : null;
  const negInfo = parseNegotiationInfo(booking?.description);
  const displayDesc = negInfo.initialDesc || (!negInfo.hasNegotiation ? booking?.description : "") || "Không có ghi chú thêm.";
  const pastHistory = negInfo.history.filter((h) => !h.isCurrent);

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-12">
      {/* 1. Top Header Card */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/customer/ongoing")}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition cursor-pointer shrink-0"
              title="Quay lại danh sách"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black text-slate-900">
                Công Trình #{booking.id}
              </h1>
              <StatusBadge status={booking.status} />
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto shrink-0">
            {["PENDING", "SURVEY_ASSIGNED", "SURVEY_REJECTED", "ACCEPTED"].includes(booking.status) && (
              <button
                type="button"
                onClick={() => handleBannerAction("cancel_survey")}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-xs transition border border-rose-200 cursor-pointer"
              >
                Hủy yêu cầu
              </button>
            )}

            {contract && (
              <button
                type="button"
                onClick={() => setContractModal(true)}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-xs transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <FileSignature className="w-3.5 h-3.5" />
                <span>{contract.customerSigned ? "Xem Hợp Đồng" : "Ký Hợp Đồng"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={refreshData}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs transition cursor-pointer"
              title="Làm mới"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Visual Progress Stepper */}
      <OrderStepper status={booking.status} booking={booking} />

      {booking.status === "CANCELLED" && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3 text-rose-900 text-xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <p>Hồ sơ yêu cầu này đã được đóng lại hoặc hủy bỏ.</p>
        </div>
      )}

      {/* 3. Tab Navigation */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {[
            { id: "overview", label: "1. Tổng quan & Tiến độ", icon: Layers },
            {
              id: "contract_quote",
              label: "2. Dự toán & Hợp đồng",
              icon: FileSignature,
              alert: canAcceptQuote || booking.status === "WAITING_DEPOSIT",
            },
            {
              id: "reports",
              label: `3. Nhật ký thi công (${dailyReports.length})`,
              icon: Paintbrush,
            },
            {
              id: "warranty_review",
              label: "4. Nghiệm thu & Tất toán",
              icon: ShieldCheck,
              alert:
                needsAcceptance ||
                needsFinalPayment ||
                (["COMPLETED", "PAID_TO_STAFF"].includes(booking.status) && !review),
            },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap relative ${
                  isActive
                    ? "bg-[#1E3A8A] text-white shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-amber-300" : "text-slate-400"}`} />
                <span>{tab.label}</span>
                {tab.alert && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-amber-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. TAB CONTENT PANELS */}

      {/* TAB 1: TỔNG QUAN & TIẾN ĐỘ */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Cột trái: Thông tin dịch vụ & Báo cáo khảo sát */}
          <div className="lg:col-span-8 space-y-4">
            {/* Gói dịch vụ đã đăng ký kèm nút Hủy trực tiếp */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Paintbrush className="w-4 h-4 text-[#1E3A8A]" />
                  <span>Các Gói Dịch Vụ Sơn Đăng Ký</span>
                </h3>
                <span className="text-[11px] font-bold text-[#1E3A8A] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {booking.bookingServices?.length || 1} gói
                </span>
              </div>

              <div className="space-y-2.5">
                {(booking.bookingServices && booking.bookingServices.length > 0
                  ? booking.bookingServices
                  : [
                      {
                        id: 1,
                        serviceName: booking.serviceName || "Dịch vụ sơn chính",
                        price: booking.totalAmount,
                        technicianName: booking.technicianName,
                      },
                    ]
                ).map((item, idx) => {
                  const isWorkerDone = Boolean(item.technicianCompleted);
                  const isSuperAccepted = Boolean(item.supervisorAccepted);
                  const isCancelled = Boolean(item.cancelled);

                  return (
                    <div
                      key={item.id || idx}
                      className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition ${
                        isCancelled
                          ? "bg-rose-50/60 border-rose-200 opacity-70"
                          : "bg-slate-50/80 border-slate-200"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded font-bold text-[11px] flex items-center justify-center shrink-0 ${isCancelled ? "bg-rose-100 text-rose-500" : "bg-blue-100 text-[#1E3A8A]"}`}>
                            {idx + 1}
                          </span>
                          <span className={`font-bold text-xs sm:text-sm truncate ${isCancelled ? "line-through text-slate-400" : "text-slate-900"}`}>
                            {item.serviceName}
                          </span>
                        </div>
                        {item.price && Number(item.price) > 0 && (
                          <span className={`font-mono font-bold block pl-7 mt-0.5 ${isCancelled ? "line-through text-slate-400" : "text-[#1E3A8A]"}`}>
                            Dự toán: {formatMoney(item.price)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pl-7 sm:pl-0 flex-wrap">
                        {isCancelled ? (
                          <span className="text-[10.5px] font-bold bg-rose-100 text-rose-600 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                            <Trash2 className="w-3 h-3" />
                            Đã hủy
                          </span>
                        ) : isSuperAccepted ? (
                          <span className="text-[10.5px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
                            ✓ Giám sát đã duyệt
                          </span>
                        ) : isWorkerDone ? (
                          <span className="text-[10.5px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                            Thợ đã xong
                          </span>
                        ) : (
                          <span className="text-[10.5px] font-medium bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                            Đang xử lý
                          </span>
                        )}

                        {/* Nút hủy dịch vụ trực tiếp - chỉ hiện khi chưa hủy */}
                        {canCancelServices && !isCancelled && (
                          <button
                            type="button"
                            onClick={() => handleCancelServiceItem(item)}
                            className="px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:text-white hover:bg-rose-600 bg-rose-50 border border-rose-200 rounded-lg transition flex items-center gap-1 cursor-pointer shadow-2xs"
                            title="Hủy không làm dịch vụ này nữa"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Hủy gói này</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Yêu cầu mô tả ban đầu */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-2">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#1E3A8A]" />
                <span>Mô Tả Yêu Cầu Hiện Trạng</span>
              </h3>
              <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed font-medium">
                {displayDesc}
              </p>
            </div>

            {/* Báo cáo khảo sát thực tế */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs">
              <SurveyReportCard
                surveyDetail={surveyDetail}
                supervisorName={booking.supervisorName}
                onPreviewImage={setPreviewImage}
              />
            </div>
          </div>

          {/* Cột phải: Thông tin công trình & Đội ngũ phụ trách */}
          <div className="lg:col-span-4 space-y-4">
            {/* Thẻ Thông tin công trình */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-[#1E3A8A]" />
                  <span>Thông Tin Công Trình</span>
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                {/* Địa chỉ */}
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10.5px] font-medium text-slate-400 block">Địa chỉ thi công</span>
                    <span className="font-semibold text-slate-800 leading-snug block mt-0.5">
                      {booking.address || "Hà Nội"}
                    </span>
                  </div>
                </div>

                {/* Ngày tạo yêu cầu */}
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10.5px] font-medium text-slate-400 block">Thời gian tạo yêu cầu</span>
                    <span className="font-semibold text-slate-800 block mt-0.5">
                      {formatDate(booking.createdAt || booking.appointmentDate)}
                    </span>
                  </div>
                </div>

                {/* Lịch hẹn / Khởi công */}
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#1E3A8A] flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10.5px] font-medium text-slate-400 block">
                      {booking.expectedStartDate ? "Dự kiến khởi công" : "Lịch hẹn khảo sát"}
                    </span>
                    <span className="font-semibold text-slate-800 block mt-0.5">
                      {booking.expectedStartDate
                        ? formatDate(booking.expectedStartDate)
                        : `${formatDate(booking.appointmentDate)} (${booking.appointmentTime || "08:00"})`}
                    </span>
                  </div>
                </div>

                {/* Tổng dự toán & Tiến độ cọc */}
                <div className="pt-2.5 border-t border-slate-100 grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 p-2.5 rounded-xl">
                    <span className="text-slate-400 block text-[10.5px]">Tổng dự toán</span>
                    <span className="font-bold text-[#1E3A8A] font-mono block mt-0.5">
                      {total > 0 ? formatMoney(total) : "Chờ khảo sát"}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl">
                    <span className="text-slate-400 block text-[10.5px]">Thanh toán</span>
                    <span className="font-bold text-slate-800 block mt-0.5 text-[11px]">
                      {isFinalPaid ? (
                        <span className="text-emerald-700">Đã tất toán</span>
                      ) : isDepositPaid ? (
                        <span className="text-blue-700">Đã cọc 30%</span>
                      ) : (
                        <span className="text-slate-500">Chưa cọc</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Thẻ Đội ngũ phụ trách */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-4 h-4 text-[#1E3A8A]" />
                  <span>Đội Ngũ Phụ Trách</span>
                </h3>
                <span className="text-[10px] text-slate-400">Bấm để xem hồ sơ</span>
              </div>

              {/* Giám sát viên */}
              <div
                onClick={() => (booking.supervisorName || booking.surveyorName) && handleOpenStaffModal("supervisor")}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5 transition hover:bg-slate-100 cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-100 text-[#1E3A8A] font-bold text-xs flex items-center justify-center shrink-0">
                  {(booking.supervisorName || "S").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Giám sát viên
                    </span>
                    {(booking.supervisorName || booking.surveyorName) && (
                      <span className="text-[10px] text-blue-700 font-bold flex items-center gap-0.5 group-hover:underline">
                        <Info className="w-2.5 h-2.5" />
                        <span>Chi tiết</span>
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-slate-900 text-xs truncate block group-hover:text-blue-700">
                    {booking.supervisorName ? `@${booking.supervisorName}` : "Đang điều phối..."}
                  </span>
                  {booking.supervisorPhone && (
                    <a
                      href={`tel:${booking.supervisorPhone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-[11px] text-blue-700 font-medium hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{booking.supervisorPhone}</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Thợ thi công */}
              <div
                onClick={() => booking.technicianName && handleOpenStaffModal("technician")}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5 transition hover:bg-slate-100 cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
                  {(booking.technicianName || "T").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Đội thợ thi công
                    </span>
                    {booking.technicianName && (
                      <span className="text-[10px] text-blue-700 font-bold flex items-center gap-0.5 group-hover:underline">
                        <Info className="w-2.5 h-2.5" />
                        <span>Chi tiết</span>
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-slate-900 text-xs truncate block group-hover:text-emerald-700">
                    {booking.technicianName ? `@${booking.technicianName}` : "Sẽ điều phối sau khi cọc"}
                  </span>
                  {booking.technicianPhone && (
                    <a
                      href={`tel:${booking.technicianPhone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-[11px] text-blue-700 font-medium hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{booking.technicianPhone}</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DỰ TOÁN & HỢP ĐỒNG */}
      {activeTab === "contract_quote" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#1E3A8A]" />
                <span>Báo Giá &amp; Dự Toán Chi Phí</span>
              </h3>
              {booking.warrantyYears && (
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                  Bảo hành chính hãng {booking.warrantyYears} năm
                </span>
              )}
            </div>

            {total === 0 ? (
              <div className="p-6 bg-slate-50 rounded-xl text-center text-xs text-slate-500 space-y-1">
                <Clock className="w-6 h-6 text-amber-500 mx-auto" />
                <p className="font-bold text-slate-700">Dự toán đang được lập sau khi hoàn tất khảo sát.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 3 Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <span className="text-slate-400 block text-[10.5px]">Tổng dự toán</span>
                    <span className="text-xl font-black text-[#1E3A8A] font-mono block mt-0.5">
                      {formatMoney(total)}
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <span className="text-slate-400 block text-[10.5px]">Thời gian dự kiến</span>
                    <span className="text-sm font-bold text-slate-800 block mt-0.5">
                      {booking.estimatedDays ? `${booking.estimatedDays} ngày làm việc` : "3-5 ngày"}
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <span className="text-slate-400 block text-[10.5px]">Lịch khởi công</span>
                    <span className="text-sm font-bold text-slate-800 block mt-0.5">
                      {booking.expectedStartDate ? formatDate(booking.expectedStartDate) : "Chờ chốt ngày"}
                    </span>
                  </div>
                </div>

                {/* Danh sách bóc tách từng gói dịch vụ kèm nút Hủy trực tiếp */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 block">Chi tiết các gói dịch vụ trong dự toán:</span>
                  {(booking.bookingServices && booking.bookingServices.length > 0
                    ? booking.bookingServices
                    : [
                        {
                          id: 1,
                          serviceName: booking.serviceName || "Dịch vụ sơn chính",
                          price: booking.totalAmount,
                        },
                      ]
                  ).map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-slate-900 block truncate">
                          {idx + 1}. {item.serviceName}
                        </span>
                        {item.price && Number(item.price) > 0 && (
                          <span className="font-mono text-[#1E3A8A] font-bold text-xs mt-0.5 block">
                            {formatMoney(item.price)}
                          </span>
                        )}
                      </div>

                      {canCancelServices && (
                        <button
                          type="button"
                          onClick={() => handleCancelServiceItem(item)}
                          className="px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:text-white hover:bg-rose-600 bg-rose-50 border border-rose-200 rounded-lg transition flex items-center gap-1 cursor-pointer shrink-0 shadow-2xs"
                          title="Hủy không làm dịch vụ này nữa"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Hủy gói này</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Split Deposit vs Final */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div>
                      <span className="text-slate-500">Đợt 1 - Cọc 30%: </span>
                      <strong className="text-slate-900 font-bold">{formatMoney(deposit)}</strong>
                      {isDepositPaid ? (
                        <span className="ml-2 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">✓ Đã nộp</span>
                      ) : (
                        <span className="ml-2 text-[10px] font-medium text-slate-600 bg-slate-200 px-1.5 py-0.2 rounded">Chờ cọc</span>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-500">Đợt 2 - Tất toán 70%: </span>
                      <strong className="text-slate-900 font-bold">{formatMoney(remaining)}</strong>
                      {isFinalPaid ? (
                        <span className="ml-2 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">✓ Đã xong</span>
                      ) : (
                        <span className="ml-2 text-[10px] font-medium text-slate-400">Sau nghiệm thu</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {canAcceptQuote && (
                      <button
                        type="button"
                        onClick={() => setQuoteResponseModalOpen(true)}
                        className="px-4 py-2 bg-[#1E3A8A] hover:bg-[#1e40a6] text-white font-bold rounded-xl text-xs transition cursor-pointer"
                      >
                        Duyệt Báo Giá
                      </button>
                    )}

                    {booking.status === "WAITING_DEPOSIT" && !isDepositPaid && (
                      <button
                        type="button"
                        onClick={() => handleBannerAction("pay_deposit")}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Thanh toán Cọc 30%</span>
                      </button>
                    )}

                    {(booking.status === "WAITING_FINAL_PAYMENT" || (booking.customerAccepted && !isFinalPaid)) && !isFinalPaid && (
                      <button
                        type="button"
                        onClick={() => handleBannerAction("pay_final")}
                        className="px-4 py-2 bg-[#1E3A8A] hover:bg-[#1e40a6] text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Tất toán 70% VNPay</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Hợp đồng */}
          {contract ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FileSignature className="w-4 h-4 text-[#1E3A8A]" />
                  <span>Hợp Đồng Điện Tử (#{contract.contractCode || `HD-${booking.id}`})</span>
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between">
                  <span className="text-slate-500">Khách hàng ký:</span>
                  <span className={`font-bold ${contract.customerSigned ? "text-emerald-700" : "text-amber-600"}`}>
                    {contract.customerSigned ? "✓ Đã ký" : "Chưa ký"}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between">
                  <span className="text-slate-500">Precision Paint:</span>
                  <span className={`font-bold ${contract.adminSigned ? "text-emerald-700" : "text-slate-400"}`}>
                    {contract.adminSigned ? "✓ Đã duyệt" : "Chờ cọc 30%"}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setContractModal(true)}
                  className="flex-1 py-2.5 bg-[#1E3A8A] hover:bg-[#1e40af] text-white font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  {contract.customerSigned ? "Xem Chi Tiết Hợp Đồng" : "Ký Hợp Đồng Ngay"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    exportContractPDF(contract, booking);
                    showToast?.("Đã xuất file PDF hợp đồng thành công!", "success");
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Tải PDF</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 text-center text-xs text-slate-400">
              Hợp đồng điện tử sẽ được khởi tạo khi bạn duyệt báo giá.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: NHẬT KÝ THI CÔNG */}
      {activeTab === "reports" && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Paintbrush className="w-4 h-4 text-[#1E3A8A]" />
              <span>Nhật Ký Thi Công Hằng Ngày ({dailyReports.length})</span>
            </h3>
          </div>

          {dailyReports.length === 0 ? (
            <div className="p-8 bg-slate-50 rounded-xl text-center text-xs text-slate-400 space-y-1">
              <Paintbrush className="w-6 h-6 text-slate-300 mx-auto" />
              <p>Chưa có báo cáo thi công nào được cập nhật.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dailyReports.map((report, idx) => {
                const imgs = parseImageUrls(report.progressImages);
                return (
                  <div key={idx} className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">
                        Ngày {formatDate(report.createdAt || report.reportDate)}
                      </span>
                      {report.progressPercentage != null && (
                        <span className="font-bold text-[#1E3A8A] bg-blue-100 px-2 py-0.5 rounded text-[11px]">
                          {report.progressPercentage}%
                        </span>
                      )}
                    </div>
                    <p className="text-slate-700 leading-relaxed font-medium bg-white p-2.5 rounded-lg border border-slate-200/60">
                      {report.content || report.description || "Thi công theo kế hoạch."}
                    </p>
                    {imgs.length > 0 && (
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-1">
                        {imgs.map((imgUrl, imgIdx) => (
                          <div
                            key={imgIdx}
                            onClick={() => setPreviewImage(imgUrl)}
                            className="aspect-square rounded-lg overflow-hidden border border-slate-200 bg-white cursor-pointer hover:opacity-90"
                          >
                            <img src={imgUrl} alt="Tiến độ" className="w-full h-full object-cover" />
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

      {/* TAB 4: NGHIỆM THU & TẤT TOÁN */}
      {activeTab === "warranty_review" && (
        <div className="space-y-4">
          {/* Nghiệm thu & Tất toán */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Nghiệm Thu &amp; Tất Toán</span>
              </h3>
              {/* Đèn nháy báo hiệu bước hiện tại */}
              {needsAcceptance ? (
                <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                  Đến bước: Nghiệm thu
                </span>
              ) : needsFinalPayment ? (
                <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-300">
                  Đến bước: Tất toán 70%
                </span>
              ) : isFinalPaid ? (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  ✓ Hoàn tất 100%
                </span>
              ) : null}
            </div>

            {/* Bước 1: Nghiệm thu */}
            {isAccepted ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-xs text-emerald-900">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Bạn đã xác nhận nghiệm thu công trình đạt chuẩn chất lượng.</span>
                </div>
                <span className="text-[10px] font-bold bg-white text-emerald-700 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                  ✓ Đã nghiệm thu
                </span>
              </div>
            ) : booking.status === "WORKER_COMPLETED" ? (
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                  <span className="text-slate-700">Công trình đã thi công xong. Mời bạn kiểm tra thực tế và xác nhận nghiệm thu:</span>
                </div>
                <button
                  type="button"
                  onClick={handleCustomerAccept}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shrink-0"
                >
                  Xác nhận Nghiệm thu
                </button>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Công trình đang trong tiến trình thi công. Nút nghiệm thu sẽ mở sau khi thợ báo hoàn thành.</span>
              </div>
            )}

            {/* Bước 2: Nút Tất toán sau khi nghiệm thu xong */}
            {isAccepted && (
              <div>
                {needsFinalPayment ? (
                  <div className="p-3.5 bg-amber-50/80 border border-amber-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      <span className="text-slate-800">
                        Tất toán 70% còn lại: <strong className="text-[#1E3A8A] font-bold text-sm">{formatMoney(remaining)}</strong>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleBannerAction("pay_final")}
                      className="px-4 py-2 bg-[#1E3A8A] hover:bg-[#1e40a6] text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-2xs"
                    >
                      <CreditCard className="w-4 h-4 text-amber-300" />
                      <span>Tất toán 70% VNPay</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Hợp đồng đã hoàn thành tất toán 100%. Gói bảo hành {booking.warrantyYears || 2} năm đã kích hoạt.</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Đánh giá */}
          {(["COMPLETED", "PAID_TO_STAFF"].includes(booking.status) || booking.paymentStatus === "FULLY_PAID") && (
            <div>
              {review ? (
                <ReviewCard
                  review={review}
                  onEdit={() => setReviewModalOpen(true)}
                  onDelete={handleDeleteReview}
                />
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Đánh giá chất lượng dịch vụ</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Gửi đánh giá để giúp chúng tôi nâng cao chất lượng.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReviewModalOpen(true)}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition cursor-pointer shrink-0"
                  >
                    Viết đánh giá
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Bảo hành */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#1E3A8A]" />
                <span>Bảo Hành &amp; Hỗ Trợ Kỹ Thuật ({booking.warrantyYears || 2} năm)</span>
              </h3>

              {["COMPLETED", "PAID_TO_STAFF"].includes(booking.status) && (
                <button
                  type="button"
                  onClick={() => setWarrantyModalOpen(true)}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs transition flex items-center gap-1 cursor-pointer"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Yêu cầu bảo hành</span>
                </button>
              )}
            </div>

            {warrantyClaims.length === 0 ? (
              <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl">
                Chưa có yêu cầu bảo hành nào. Nếu có hiện tượng bong tróc hay ẩm mốc, quý khách có thể gửi yêu cầu hỗ trợ miễn phí.
              </p>
            ) : (
              <WarrantyClaimList
                claims={warrantyClaims}
                onPreviewImage={setPreviewImage}
                onClaimUpdated={fetchWarrantyClaims}
                showToast={showToast}
              />
            )}
          </div>
        </div>
      )}

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
      />

      <QuoteResponseModal
        isOpen={quoteResponseModalOpen}
        onClose={() => setQuoteResponseModalOpen(false)}
        booking={booking}
        onAccept={(startDate, preferredTechnicianId, updatedBookingServices) => {
          setSelectedStartDate(startDate);
          setQuoteResponseModalOpen(false);
          const payload = {
            ...booking,
            expectedStartDate: startDate,
            preferredTechnicianId: preferredTechnicianId || null,
          };
          if (updatedBookingServices && updatedBookingServices.length > 0) {
            payload.bookingServices = updatedBookingServices;
          }
          AxiosConfig.put(`/bookings/${id}`, payload).then(() => {
            setContractModal(true);
            refreshData();
          }).catch((e) => {
            showToast?.(e.response?.data?.message || "Lỗi cập nhật ngày thi công!", "error");
          });
        }}
        onNegotiate={handleNegotiateQuote}
        onCancelNegotiation={handleCancelNegotiation}
      />

      <ImageLightboxModal imageUrl={previewImage} onClose={() => setPreviewImage(null)} />

      <WarrantyClaimModal
        isOpen={warrantyModalOpen}
        onClose={() => setWarrantyModalOpen(false)}
        booking={booking}
        showToast={showToast}
        onSuccess={fetchWarrantyClaims}
      />

      <StaffDetailModal
        isOpen={Boolean(selectedStaffProfile)}
        onClose={() => setSelectedStaffProfile(null)}
        staff={selectedStaffProfile}
      />

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
