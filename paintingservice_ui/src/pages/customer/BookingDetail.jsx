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
  DollarSign,
  ShieldAlert,
  Wrench,
  Layers,
  Paintbrush,
  CheckCircle2,
  ChevronRight,
  MapPin,
  Send,
  Edit,
  Trash2,
} from "lucide-react";
import AxiosConfig from "../../util/AxiosConfig";
import StatusBadge from "../../components/common/StatusBadge";
import OrderStepper from "../../components/common/OrderStepper";
import OrderActionBanner from "../../components/common/OrderActionBanner";
import SurveyReportCard from "../../components/common/SurveyReportCard";
import ContractModal from "../../components/common/ContractModal";
import ImageLightboxModal from "../../components/common/ImageLightboxModal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import RejectQuoteModal from "../../components/common/RejectQuoteModal";
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

  // Tab management: 'overview' | 'contract_quote' | 'reports' | 'warranty_review'
  const [activeTab, setActiveTab] = useState("overview");

  const [contractModal, setContractModal] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [selectedStartDate, setSelectedStartDate] = useState("");
  const [acceptingQuote, setAcceptingQuote] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedStaffProfile, setSelectedStaffProfile] = useState(null);
  const [loadingStaffProfile, setLoadingStaffProfile] = useState(false);
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
        "Bạn xác nhận công trình đã được thi công hoàn thiện đạt yêu cầu chất lượng?\n\nSau khi nghiệm thu, bạn có thể tiến hành thanh toán phần tất toán còn lại (70%) qua VNPay Sandbox.",
      onConfirm: async () => {
        try {
          const res = await AxiosConfig.get(`/booking-details/booking/${id}`);
          const details = Array.isArray(res.data) ? res.data : [];
          const pending = details.filter((d) => !d.customerAccepted);
          if (pending.length > 0) {
            await Promise.all(
              pending.map((d) => AxiosConfig.post(`/booking-details/${d.id}/customer-accept`))
            );
          }

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
      showToast?.("Đề xuất thương lượng đã được gửi tới Admin! Họ sẽ liên hệ lại với bạn sớm.", "success");
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
    if (actionType === "cancel_survey") {
      setConfirmDialog({
        title: "Xác nhận hủy yêu cầu khảo sát",
        message: "Bạn có chắc chắn muốn hủy yêu cầu khảo sát cho công trình này không? Chuyên viên khảo sát sẽ không đến hiện trường nữa.",
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
    } else if (actionType === "reject_quote") {
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

  // Xem thông tin chi tiết nhân sự (Giám sát / Thợ)
  const handleOpenStaffModal = async (type) => {
    const isSupervisor = type === "supervisor";
    const userId = isSupervisor ? (booking.supervisorId || booking.surveyorId) : booking.technicianId;
    const username = isSupervisor ? (booking.supervisorName || booking.surveyorName) : booking.technicianName;
    const phone = isSupervisor ? booking.supervisorPhone : booking.technicianPhone;
    const avatar = isSupervisor ? (booking.supervisorAvatar || booking.surveyorAvatar) : booking.technicianAvatar;

    if (!userId && !username) {
      showToast?.("Chưa có nhân sự được phân công cho vị trí này!", "info");
      return;
    }

    setLoadingStaffProfile(true);
    try {
      if (userId) {
        const res = await AxiosConfig.get(`/staff/by-user/${userId}`);
        if (res.data) {
          setSelectedStaffProfile(res.data);
          return;
        }
      }
    } catch (e) {
      console.warn("Could not fetch full staff profile, falling back to booking fields", e);
    } finally {
      setLoadingStaffProfile(false);
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
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-sm w-full">
          <div className="text-4xl mb-3">📋</div>
          <h2 className="font-bold text-slate-800 text-base">Không tìm thấy công trình #{id}</h2>
          <button
            type="button"
            onClick={() => navigate("/customer/ongoing")}
            className="mt-4 px-5 py-2.5 rounded-xl bg-[#1E3A8A] text-white text-xs font-bold cursor-pointer"
          >
            Về Danh sách công trình
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
  const isFinalPaid = Boolean(booking.finalPaid || booking.paymentStatus === "FULLY_PAID");

  const canAcceptQuote =
    ["WAITING_CUSTOMER_SIGNATURE", "WAITING_ADMIN_QUOTE", "CUSTOMER_ACCEPTED_QUOTE"].includes(booking.status) &&
    total > 0 &&
    (!contract || !contract.customerSigned);
  const surveyDetail = bookingDetails && bookingDetails.length > 0 ? bookingDetails[0] : null;

  const negInfo = parseNegotiationInfo(booking?.description);
  const displayDesc = negInfo.initialDesc || (!negInfo.hasNegotiation ? booking?.description : "") || "Khách hàng không ghi chú mô tả ban đầu.";
  const pastHistory = negInfo.history.filter((h) => !h.isCurrent);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/customer/ongoing")}
            className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 font-bold transition cursor-pointer shrink-0"
            title="Quay lại danh sách công trình"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                Công Trình #{booking.id}
              </h1>
              <StatusBadge status={booking.status} />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Khởi tạo: {formatDate(booking.createdAt || booking.appointmentDate)} • Gói:{" "}
              <strong className="text-slate-800">{booking.serviceName || booking.service?.name || "Sơn sửa nhà"}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
          {["PENDING", "SURVEY_ASSIGNED", "SURVEY_REJECTED", "ACCEPTED"].includes(booking.status) && (
            <button
              type="button"
              onClick={() => handleBannerAction("cancel_survey")}
              className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition flex items-center gap-1.5 border border-rose-200 cursor-pointer shadow-2xs"
              title="Hủy yêu cầu khảo sát hiện tại"
            >
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Hủy yêu cầu</span>
            </button>
          )}

          {contract && (
            <button
              type="button"
              onClick={() => setContractModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black rounded-xl text-xs transition flex items-center gap-2 shadow-xs shadow-amber-500/20 cursor-pointer"
            >
              <FileSignature className="w-4 h-4 text-white" />
              <span>{contract.customerSigned ? "Xem Hợp Đồng" : "Ký Hợp Đồng Ngay"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={refreshData}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
            title="Cập nhật lại dữ liệu mới nhất"
          >
            <RefreshCw className="w-4 h-4 text-slate-700" />
          </button>
        </div>
      </div>

      {/* 2. 6-Stage Progress Stepper */}
      <OrderStepper status={booking.status} />

      {/* 2.5 Bảng thông tin nhanh (Quick Info Strip) - Thiết kế trung tính, trang nhã, dễ nhìn */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 bg-white rounded-2xl border border-slate-200 py-3.5 px-4 text-center shadow-xs">
        <div className="p-1.5">
          <span className="text-xs text-slate-500 font-medium block">Dịch vụ yêu cầu</span>
          <strong className="text-slate-900 text-sm block mt-0.5 truncate" title={booking.serviceName}>
            {booking.serviceName || booking.service?.name || "Dịch vụ sơn nhà"}
          </strong>
        </div>

        <div className="p-1.5">
          <span className="text-xs text-slate-500 font-medium block">Địa chỉ công trình</span>
          <span className="font-medium text-slate-700 text-sm block mt-0.5 truncate" title={booking.address}>
            {booking.address || "Chưa có địa chỉ"}
          </span>
        </div>

        <div className="p-1.5">
          <span className="text-xs text-slate-500 font-medium block">
            {booking.expectedStartDate ? "Ngày khởi công" : "Lịch hẹn khảo sát"}
          </span>
          <strong className="text-slate-900 text-sm block mt-0.5">
            {booking.expectedStartDate
              ? formatDate(booking.expectedStartDate)
              : `${formatDate(booking.appointmentDate)} • ${booking.appointmentTime || "08:00"}`}
          </strong>
        </div>

        <div className="p-1.5">
          <span className="text-xs text-slate-500 font-medium block">Tổng dự toán</span>
          <div className="font-bold text-slate-900 font-mono text-sm block mt-0.5">
            {total > 0 ? (
              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                <span>{formatMoney(total)}</span>
                {isFinalPaid ? (
                  <span className="text-[11px] font-sans font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">Đã tất toán</span>
                ) : isDepositPaid ? (
                  <span className="text-[11px] font-sans font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">Đã cọc 30%</span>
                ) : (
                  <span className="text-[11px] font-sans font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">Chờ cọc</span>
                )}
              </div>
            ) : (
              <span className="text-slate-400 font-sans font-normal text-xs">Chờ lập dự toán</span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Hero Action Guidance Banner */}
      <OrderActionBanner
        role="customer"
        booking={booking}
        contract={contract}
        review={review}
        canAcceptQuote={canAcceptQuote}
        onAction={handleBannerAction}
      />

      {/* 4. Alert if Cancelled */}
      {booking.status === "CANCELLED" && (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-5 sm:p-6 shadow-xs flex items-start gap-4 text-rose-900">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          </div>
          <div className="space-y-1 flex-1">
            <h3 className="text-sm font-black text-rose-950 uppercase tracking-wider">
              Yêu cầu công trình này đã kết thúc / Hủy bỏ
            </h3>
            <p className="text-xs text-rose-800 leading-relaxed">
              Hồ sơ khảo sát này đã được đóng lại. Nếu quý khách có nhu cầu khảo sát lại hoặc tư vấn phương án mới, vui lòng đăng ký một yêu cầu mới hoặc liên hệ tổng đài hỗ trợ Precision Paint.
            </p>
          </div>
        </div>
      )}

      {/* 5. Modern Tabbed Navigation Bar */}
      <div className="bg-white p-2 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            {
              id: "overview",
              label: "1. Tổng quan & Tiến độ",
              icon: Layers,
            },
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
              label: "4. Nghiệm thu & Bảo hành",
              icon: ShieldCheck,
              alert: ["COMPLETED", "PAID_TO_STAFF"].includes(booking.status) && !review,
            },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap relative ${isActive
                  ? "bg-[#1E3A8A] text-white shadow-sm shadow-[#1E3A8A]/30 font-black"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-amber-400" : "text-slate-400"}`} />
                <span>{tab.label}</span>
                {tab.alert && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping absolute top-2 right-2" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 6. TAB CONTENT PANELS */}

      {/* ========================================================================= */}
      {/* TAB 1: TỔNG QUAN & TIẾN ĐỘ                                                */}
      {/* ========================================================================= */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left 2 Cols: Project Info & Survey Report */}
            <div className="lg:col-span-2 space-y-6">
              {/* Card: Yêu cầu thi công & Ghi chú của bạn */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#1E3A8A]" />
                    <span>Yêu Cầu Thi Công &amp; Ghi Chú Của Bạn</span>
                  </h3>
                  {booking.warrantyYears && (
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      🛡️ Cam kết bảo hành {booking.warrantyYears} năm
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-slate-400 font-bold block uppercase text-[10px]">
                      Thời gian gửi yêu cầu
                    </span>
                    <span className="text-slate-800 font-bold text-sm">
                      {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString("vi-VN") : "Hôm nay"}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-slate-400 font-bold block uppercase text-[10px]">
                      Thời gian thi công dự kiến
                    </span>
                    <span className="text-slate-800 font-bold text-sm">
                      {booking.estimatedDays ? `${booking.estimatedDays} ngày hoàn thiện` : "Chờ chuyên viên khảo sát thực tế"}
                    </span>
                  </div>
                </div>

                {/* Initial Description */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs space-y-1.5">
                  <span className="text-slate-400 font-bold block uppercase text-[10px]">
                    Nội dung mô tả yêu cầu ban đầu
                  </span>
                  <p className="text-slate-800 leading-relaxed font-medium whitespace-pre-wrap">
                    {displayDesc || "Không có ghi chú thêm."}
                  </p>
                </div>
              </div>

              {/* Card: Báo cáo khảo sát thực tế từ chuyên viên */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
                <SurveyReportCard
                  surveyDetail={surveyDetail}
                  supervisorName={booking.supervisorName}
                  onPreviewImage={setPreviewImage}
                />
              </div>
            </div>

            {/* Right 1 Col: Đội ngũ phụ trách */}
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-[#1E3A8A]" />
                  <span>Đội Ngũ Phụ Trách Công Trình</span>
                </h3>

                <div className="space-y-3 text-xs">
                  {/* Giám sát viên */}
                  <div
                    onClick={() => (booking.supervisorName || booking.surveyorName) && handleOpenStaffModal("supervisor")}
                    className={`p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3 transition ${booking.supervisorName || booking.surveyorName
                      ? "hover:bg-slate-100 cursor-pointer group shadow-2xs"
                      : "opacity-80"
                      }`}
                  >
                    {booking.supervisorAvatar || booking.surveyorAvatar ? (
                      <img
                        src={booking.supervisorAvatar || booking.surveyorAvatar}
                        alt={booking.supervisorName || booking.surveyorName}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center shrink-0 border border-slate-300">
                        {(booking.supervisorName || booking.surveyorName || "S").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-slate-500 block">
                          Giám sát viên khảo sát
                        </span>
                        {(booking.supervisorName || booking.surveyorName) && (
                          <span className="text-[10px] text-blue-700 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                            Hồ sơ →
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-slate-900 text-sm truncate group-hover:text-blue-700 transition-colors">
                        {booking.supervisorName || booking.surveyorName
                          ? `@${booking.supervisorName || booking.surveyorName}`
                          : "Đang phân bổ chuyên viên..."}
                      </div>
                      {booking.supervisorPhone && (
                        <a
                          href={`tel:${booking.supervisorPhone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 text-blue-700 font-medium hover:underline text-xs mt-0.5"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{booking.supervisorPhone}</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Đội thợ sơn */}
                  <div
                    onClick={() => booking.technicianName && handleOpenStaffModal("technician")}
                    className={`p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3 transition ${booking.technicianName
                      ? "hover:bg-slate-100 cursor-pointer group shadow-2xs"
                      : "opacity-80"
                      }`}
                  >
                    {booking.technicianAvatar ? (
                      <img
                        src={booking.technicianAvatar}
                        alt={booking.technicianName}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center shrink-0 border border-slate-300">
                        {(booking.technicianName || booking.preferredTechnicianName || "T").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-slate-500 block">
                          Đội thợ thi công
                        </span>
                        {booking.technicianName && (
                          <span className="text-[10px] text-blue-700 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                            Hồ sơ →
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-slate-900 text-sm truncate group-hover:text-blue-700 transition-colors">
                        {booking.technicianName
                          ? `@${booking.technicianName}`
                          : booking.preferredTechnicianName
                            ? `@${booking.preferredTechnicianName} (Ưu tiên)`
                            : "Sẽ gán sau khi cọc 30%"}
                      </div>
                      {booking.technicianPhone && (
                        <a
                          href={`tel:${booking.technicianPhone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 text-blue-700 font-medium hover:underline text-xs mt-0.5"
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
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DỰ TOÁN & HỢP ĐỒNG                                                 */}
      {/* ========================================================================= */}
      {activeTab === "contract_quote" && (
        <div className="space-y-6">
          {/* Card: Báo giá & Dự toán thi công */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-7 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#1E3A8A]" />
                  <span>Báo Giá Dịch Vụ &amp; Dự Toán Chi Phí Thi Công</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Bảng kê minh bạch đã bao gồm toàn bộ vật tư sơn chính hãng và công thợ
                </p>
              </div>

              {booking.warrantyYears && (
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
                  🛡️ Bảo hành chính hãng {booking.warrantyYears} năm
                </span>
              )}
            </div>

            {total === 0 ? (
              <div className="p-8 bg-slate-50 rounded-2xl text-center text-xs text-slate-500 border border-slate-200/80 space-y-2">
                <Clock className="w-8 h-8 text-amber-500 mx-auto" />
                <p className="font-bold text-slate-700">Dự toán đang được lập sau buổi khảo sát thực tế.</p>
                <p className="text-slate-400">Giám sát viên sẽ hoàn tất bóc tách khối lượng và gửi báo giá chi tiết lên hệ thống sớm nhất.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {/* 3 Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Tổng chi phí thi công
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-[#1E3A8A] block">
                      {formatMoney(total)}
                    </span>
                    <span className="text-[11px] text-slate-500 block">Trọn gói vật tư &amp; nhân công</span>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Thời gian thi công dự kiến
                    </span>
                    <span className="text-lg font-black text-slate-900 block flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-[#1E3A8A]" />
                      <span>{booking.estimatedDays || 3} ngày làm việc</span>
                    </span>
                    <span className="text-[11px] text-slate-500 block">Kể từ ngày khởi công</span>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Lịch khởi công dự kiến
                    </span>
                    <span className="text-lg font-black text-slate-900 block flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-[#1E3A8A]" />
                      <span className="truncate">
                        {booking.expectedStartDate ? formatDate(booking.expectedStartDate) : "Chờ chốt ngày"}
                      </span>
                    </span>
                    <span className="text-[11px] text-slate-500 block">Theo thỏa thuận hợp đồng</span>
                  </div>
                </div>

                {/* Split Deposit vs Final */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-600">1. Đợt 1 - Cọc 30% ký hợp đồng:</span>
                      <strong className="text-slate-900 font-bold">{formatMoney(deposit)}</strong>
                      {isDepositPaid ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">✓ Đã cọc</span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-600 bg-slate-200 px-2 py-0.5 rounded">Chưa thanh toán</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-600">2. Đợt 2 - Tất toán 70% nghiệm thu:</span>
                      <strong className="text-slate-900 font-bold">{formatMoney(remaining)}</strong>
                      {isFinalPaid ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">✓ Đã tất toán</span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Sau khi nghiệm thu</span>
                      )}
                    </div>
                  </div>

                  {canAcceptQuote && (
                    <button
                      type="button"
                      onClick={() => setQuoteResponseModalOpen(true)}
                      className="px-5 py-2.5 bg-[#1E3A8A] hover:bg-[#1e40a6] text-white font-bold rounded-xl text-xs transition cursor-pointer whitespace-nowrap self-start sm:self-auto shadow-xs"
                    >
                      Duyệt Báo Giá &amp; Chọn Ngày Khởi Công
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Đề xuất thương lượng giá nếu có */}
          {negInfo.hasNegotiation && (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <span className="font-bold text-slate-900 flex items-center gap-2 text-xs sm:text-sm">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                  Đề xuất thương lượng giá đang chờ Admin phản hồi ({negInfo.negotiateTime || "Mới nhất"})
                </span>
                <span className="text-[11px] font-semibold bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full">
                  Đang xử lý
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-medium block">Báo giá gốc từ hệ thống</span>
                  <span className="font-bold text-slate-900 text-base block mt-0.5">
                    {negInfo.originalQuotePrice || formatMoney(total)}
                  </span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-blue-200">
                  <span className="text-[11px] text-blue-600 font-medium block">Mức giá bạn đề xuất</span>
                  <span className="font-bold text-blue-700 text-base block mt-0.5">
                    {negInfo.proposedPrice || "Không nêu mức giá cụ thể"}
                  </span>
                </div>
              </div>

              {negInfo.message && (
                <div className="text-slate-800 text-xs bg-white p-3 rounded-xl border border-slate-200 leading-relaxed">
                  <span className="text-[11px] text-slate-400 font-medium block mb-0.5">Lý do thương lượng gửi Admin:</span>
                  "{negInfo.message}"
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setQuoteResponseModalOpen(true)}
                  className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs border border-slate-200 transition cursor-pointer flex items-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Sửa đề xuất</span>
                </button>
                <button
                  type="button"
                  onClick={handleCancelNegotiation}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-xl text-xs border border-rose-200 transition cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hủy thương lượng</span>
                </button>
              </div>
            </div>
          )}

          {/* Lịch sử thương lượng giá trước đó */}
          {pastHistory.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                <span>📜</span> Lịch sử thương lượng giá ({pastHistory.length} lượt trước):
              </span>
              <div className="space-y-2">
                {pastHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700 font-medium"
                  >
                    • {item.rawText}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Thẻ Hợp đồng điện tử */}
          {contract ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-7 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <FileSignature className="w-5 h-5 text-[#1E3A8A]" />
                  <span>Hợp Đồng Điện Tử Thi Công Sơn Nhà</span>
                </h3>
                <span className="text-xs font-bold text-slate-500 font-mono">
                  Mã HĐ: {contract.contractCode || `HD-${booking.id}`}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Khách hàng ký kết:</span>
                  <span className={`font-black ${contract.customerSigned ? "text-emerald-700" : "text-amber-600"}`}>
                    {contract.customerSigned ? "✓ Đã ký điện tử" : "Chưa ký"}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Đại diện Precision Paint:</span>
                  <span className={`font-black ${contract.adminSigned ? "text-emerald-700" : "text-slate-400"}`}>
                    {contract.adminSigned ? "✓ Đã ký duyệt" : "Chờ cọc 30%"}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setContractModal(true)}
                  className="flex-1 py-3 bg-[#1E3A8A] hover:bg-[#1e40af] text-white font-black rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-white" />
                  <span>{contract.customerSigned ? "Xem Chi Tiết Hợp Đồng & Điều Khoản" : "Ký Hợp Đồng Ngay"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    exportContractPDF(contract, booking);
                    showToast?.("Đã tải xuống file PDF hợp đồng thành công!", "success");
                  }}
                  className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Xuất File PDF / In Hợp Đồng</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-8 text-center text-xs text-slate-500 space-y-2">
              <FileSignature className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-700">Hợp đồng điện tử sẽ được tạo ngay khi bạn duyệt báo giá.</p>
              <p className="text-slate-400">Hợp đồng có giá trị pháp lý đầy đủ và được ký duyệt trực tuyến nhanh chóng.</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: NHẬT KÝ THI CÔNG                                                  */}
      {/* ========================================================================= */}
      {activeTab === "reports" && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-7 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#1E3A8A]" />
                  <span>Nhật Ký &amp; Tiến Độ Thi Công Hàng Ngày</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Đội thợ và giám sát cập nhật hình ảnh và khối lượng công việc mỗi ngày
                </p>
              </div>
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
                {dailyReports.length} báo cáo
              </span>
            </div>

            {dailyReports.length === 0 ? (
              <div className="p-10 bg-slate-50 rounded-2xl text-center text-xs text-slate-500 border border-slate-200/80 space-y-2">
                <Paintbrush className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-bold text-slate-700 text-sm">Chưa có báo cáo thi công nào được cập nhật.</p>
                <p className="text-slate-400 max-w-md mx-auto leading-relaxed">
                  Ngay khi công trình bắt đầu khởi công, các hình ảnh thi công từng phòng, tiến độ % hoàn thành và ghi chú kỹ thuật sẽ xuất hiện đầy đủ tại đây.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {dailyReports.map((report, idx) => {
                  const imgs = parseImageUrls(report.progressImages);
                  return (
                    <div
                      key={idx}
                      className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3.5 hover:bg-slate-50 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#1E3A8A]" />
                          <span className="font-black text-slate-900 text-xs sm:text-sm">
                            Ngày {formatDate(report.createdAt || report.reportDate)}
                          </span>
                        </div>
                        {report.progressPercentage != null && (
                          <span className="text-xs font-black text-[#1E3A8A] bg-blue-100 px-3 py-1 rounded-lg">
                            {report.progressPercentage}% hoàn thành
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed font-medium bg-white p-3.5 rounded-xl border border-slate-200/60">
                        {report.content || report.description || "Đang thi công sơn sửa theo kế hoạch kỹ thuật."}
                      </p>

                      {imgs.length > 0 && (
                        <div>
                          <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                            Hình ảnh thực tế tại công trình ({imgs.length} ảnh):
                          </span>
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                            {imgs.map((imgUrl, imgIdx) => (
                              <div
                                key={imgIdx}
                                onClick={() => setPreviewImage(imgUrl)}
                                className="aspect-square rounded-xl overflow-hidden border border-slate-200 bg-white hover:scale-105 transition cursor-pointer group relative shadow-2xs"
                              >
                                <img src={imgUrl} alt="Tiến độ" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-bold">
                                  🔍 Phóng to
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: NGHIỆM THU & BẢO HÀNH                                              */}
      {/* ========================================================================= */}
      {activeTab === "warranty_review" && (
        <div className="space-y-6">
          {/* Card: Đánh Giá & Góp Ý Cho Đội Thợ */}
          {(["COMPLETED", "PAID_TO_STAFF"].includes(booking.status) || booking.paymentStatus === "FULLY_PAID") && (
            <div>
              {review ? (
                <ReviewCard
                  review={review}
                  onEdit={() => setReviewModalOpen(true)}
                  onDelete={handleDeleteReview}
                />
              ) : (
                <div className="bg-gradient-to-br from-slate-900 via-[#1E3A8A] to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md border border-blue-400/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
                  <div className="flex items-start gap-4 z-10">
                    <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center text-2xl shrink-0 font-black">
                      ★
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                          Chia sẻ trải nghiệm
                        </span>
                        <span className="text-xs text-blue-200 font-bold">1 phút gửi đánh giá</span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-white">
                        Đánh Giá Chất Lượng Thi Công &amp; Góp Ý Cho Đội Thợ
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                        Công trình đã nghiệm thu thành công! Ý kiến đóng góp chân thành của quý khách sẽ giúp đội thợ không ngừng nâng cao tay nghề phục vụ.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReviewModalOpen(true)}
                    className="w-full sm:w-auto px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-white font-black rounded-2xl text-xs transition shrink-0 shadow-lg flex items-center justify-center gap-2 cursor-pointer z-10 hover:scale-105 duration-150"
                  >
                    <Star className="w-4 h-4 fill-white text-white" />
                    <span>Đánh Giá Thợ Ngay</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Card: Quyền Lợi Bảo Hành & Phiếu Yêu Cầu */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-7 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wider">
                  Quyền Lợi Bảo Hành &amp; Hỗ Trợ Kỹ Thuật
                </h3>
              </div>
              {["COMPLETED", "PAID_TO_STAFF"].includes(booking.status) && (
                hasActiveWarrantyClaim ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-800 text-xs font-semibold rounded-xl border border-amber-200">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Đang có yêu cầu bảo hành đang xử lý</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setWarrantyModalOpen(true)}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Gửi Yêu Cầu Bảo Hành</span>
                  </button>
                )
              )}
            </div>

            {warrantyClaims.length === 0 ? (
              <div className="p-6 bg-emerald-50/60 rounded-2xl border border-emerald-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                <div className="space-y-1 text-emerald-950">
                  <p className="font-bold text-sm">
                    🛡️ Công trình được bảo hành chính hãng {booking.warrantyYears || 2} năm.
                  </p>
                  <p className="text-emerald-800 text-xs leading-relaxed max-w-xl">
                    Nếu phát sinh bất kỳ hiện tượng nứt chân chim, bong tróc hay ẩm mốc kỹ thuật, đội ngũ chuyên viên bảo trì của Precision Paint sẽ có mặt xử lý miễn phí 100%.
                  </p>
                </div>
                {["COMPLETED", "PAID_TO_STAFF"].includes(booking.status) && (
                  <button
                    type="button"
                    onClick={() => setWarrantyModalOpen(true)}
                    className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition whitespace-nowrap cursor-pointer shrink-0 shadow-xs"
                  >
                    Tạo Phiếu Hỗ Trợ Kỹ Thuật
                  </button>
                )}
              </div>
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
        onRejectQuote={() => setRejectModalOpen(true)}
      />

      <RejectQuoteModal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        booking={booking}
        onConfirmReject={handleRejectQuote}
        loading={rejecting}
      />

      <QuoteResponseModal
        isOpen={quoteResponseModalOpen}
        onClose={() => setQuoteResponseModalOpen(false)}
        booking={booking}
        onAccept={(startDate, preferredTechnicianId) => {
          setSelectedStartDate(startDate);
          setQuoteResponseModalOpen(false);
          AxiosConfig.put(`/bookings/${id}`, {
            ...booking,
            expectedStartDate: startDate,
            preferredTechnicianId: preferredTechnicianId || null,
          }).then(() => {
            setContractModal(true);
            refreshData();
          }).catch((e) => {
            showToast?.(e.response?.data?.message || "Lỗi cập nhật ngày thi công / đội thợ!", "error");
          });
        }}
        onNegotiate={handleNegotiateQuote}
        onCancelNegotiation={handleCancelNegotiation}
        onReject={handleRejectQuote}
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
