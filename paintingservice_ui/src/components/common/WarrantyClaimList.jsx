import React, { useState } from "react";
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Wrench,
  Calendar,
  User,
  Phone,
  MapPin,
  DollarSign,
  ClipboardCheck,
  Sparkles,
  Send,
  Check,
  X,
  QrCode,
  CreditCard,
  Edit3,
  Trash2,
  UserCheck,
} from "lucide-react";
import Modal from "./Modal";
import QRCodePayment from "./QRCodePayment";
import EditWarrantyClaimModal from "./EditWarrantyClaimModal";
import AxiosConfig from "../../util/AxiosConfig";
import { formatDate, parseImageUrls } from "../../util/orderFlowUtils";
import { formatMoney } from "../../util/formatters";

const STATUS_CONFIG = {
  PENDING: {
    label: "1. Chờ tiếp nhận & Phân giám sát",
    badge: "bg-amber-50 text-amber-800 border-amber-200",
    icon: Clock,
  },
  SURVEY_ASSIGNED: {
    label: "2. Giám sát đang kiểm tra hiện trường",
    badge: "bg-blue-50 text-blue-800 border-blue-200",
    icon: MapPin,
  },
  SURVEYOR_ACCEPTED: {
    label: "2b. Giám sát đã tiếp nhận việc",
    badge: "bg-blue-50 text-blue-800 border-blue-200",
    icon: UserCheck,
  },
  SURVEYOR_REJECTED: {
    label: "Đang điều phối lại Giám sát",
    badge: "bg-amber-50 text-amber-800 border-amber-200",
    icon: Clock,
  },
  SURVEYED: {
    label: "3. Đã có kết quả khảo sát",
    badge: "bg-indigo-50 text-indigo-800 border-indigo-200",
    icon: ClipboardCheck,
  },
  CUSTOMER_ACCEPTED_SUPPORT: {
    label: "3b. Đã đồng ý giá hỗ trợ • Chờ phân Thợ",
    badge: "bg-purple-50 text-purple-800 border-purple-200",
    icon: Sparkles,
  },
  ACCEPTED: {
    label: "4. Đã phân công Đội thợ thi công",
    badge: "bg-teal-50 text-teal-800 border-teal-200",
    icon: User,
  },
  IN_PROGRESS: {
    label: "4. Đang sửa chữa dặm vá",
    badge: "bg-sky-50 text-sky-800 border-sky-200",
    icon: Wrench,
  },
  WORKER_COMPLETED: {
    label: "5. Thợ đã xong • Chờ nghiệm thu & thanh toán",
    badge: "bg-orange-50 text-orange-800 border-orange-200",
    icon: Clock,
  },
  COMPLETED: {
    label: "6. Đã hoàn tất & Nghiệm thu",
    badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
    icon: CheckCircle2,
  },
  REJECTED: {
    label: "7. Từ chối BH & Báo giá hỗ trợ",
    badge: "bg-rose-50 text-rose-800 border-rose-200",
    icon: XCircle,
  },
  CANCELLED: {
    label: "Đã hủy / Đã đóng",
    badge: "bg-slate-100 text-slate-600 border-slate-200",
    icon: XCircle,
  },
};

const ISSUE_LABELS = {
  BONG_TROC: "Bong tróc / Rộp sơn",
  PHAI_MAU: "Phai màu / Ố vàng",
  NUT_NE: "Nứt rạn chân chim",
  THAM_NUOC: "Thấm dột / Ẩm mốc",
  KHAC: "Sự cố kỹ thuật khác",
};

export default function WarrantyClaimList({ claims = [], onPreviewImage, onClaimUpdated, showToast }) {
  const [acceptModalClaim, setAcceptModalClaim] = useState(null);
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("08:30");
  const [customerNote, setCustomerNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState("");

  // Chỉnh sửa & Xóa yêu cầu (trước khi Giám sát nhận việc)
  const [editingClaim, setEditingClaim] = useState(null);
  const [deletingClaim, setDeletingClaim] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Modal xác nhận từ chối sửa chữa hỗ trợ
  const [declineModalClaim, setDeclineModalClaim] = useState(null);
  const [decliningSupport, setDecliningSupport] = useState(false);

  // Modal thanh toán QR phí hỗ trợ
  const [payModalClaim, setPayModalClaim] = useState(null);
  const [paying, setPaying] = useState(false);
  const [payingVNPay, setPayingVNPay] = useState(false);

  if (!claims || claims.length === 0) return null;

  const canEditOrDelete = (claim) => {
    return ["PENDING", "SURVEY_ASSIGNED", "SURVEYOR_REJECTED"].includes(claim.status);
  };

  const handleDeleteClaim = async () => {
    if (!deletingClaim) return;
    setDeleting(true);
    try {
      await AxiosConfig.delete(`/warranty-claims/${deletingClaim.id}`);
      showToast?.("Đã xóa yêu cầu bảo hành thành công!", "success");
      setDeletingClaim(null);
      onClaimUpdated?.();
    } catch (err) {
      showToast?.(err.response?.data?.message || "Không thể xóa yêu cầu bảo hành!", "error");
    } finally {
      setDeleting(false);
    }
  };

  // Lấy ngày mai làm min date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDateStr = tomorrow.toISOString().split("T")[0];

  // Mở modal đồng ý hỗ trợ
  const handleOpenAcceptModal = (claim) => {
    setAcceptModalClaim(claim);
    setPreferredDate(claim.preferredDate || minDateStr);
    setPreferredTime(claim.preferredTime || "08:30");
    setCustomerNote("");
    setActionError("");
  };

  // Xác nhận đồng ý sửa chữa có hỗ trợ
  const handleSubmitAccept = async (e) => {
    e.preventDefault();
    if (!preferredDate) {
      setActionError("Vui lòng chọn ngày mong muốn thi công!");
      return;
    }
    setSubmitting(true);
    setActionError("");
    try {
      await AxiosConfig.post(`/warranty-claims/${acceptModalClaim.id}/customer-response`, {
        accepted: true,
        preferredDate: preferredDate,
        preferredTime: preferredTime,
        customerNote: customerNote,
      });
      setAcceptModalClaim(null);
      onClaimUpdated?.();
    } catch (err) {
      setActionError(err.response?.data?.message || "Thao tác thất bại, vui lòng thử lại!");
    } finally {
      setSubmitting(false);
    }
  };

  // Từ chối sửa chữa hỗ trợ: mở Modal xác nhận (không dùng window.confirm/alert)
  const handleOpenDeclineModal = (claim) => {
    setDeclineModalClaim(claim);
  };

  const handleConfirmDeclineSupport = async () => {
    if (!declineModalClaim) return;
    setDecliningSupport(true);
    try {
      await AxiosConfig.post(`/warranty-claims/${declineModalClaim.id}/customer-response`, {
        accepted: false,
      });
      showToast?.("Bạn đã từ chối phương án sửa chữa có hỗ trợ. Phiếu bảo hành đã được đóng.", "info");
      setDeclineModalClaim(null);
      onClaimUpdated?.();
    } catch (err) {
      showToast?.(err.response?.data?.message || "Không thể từ chối hỗ trợ, vui lòng thử lại!", "error");
    } finally {
      setDecliningSupport(false);
    }
  };

  // Thanh toán trực tuyến VNPay Sandbox cho chi phí hỗ trợ
  const handlePayVNPaySupport = async (claim) => {
    setPayingVNPay(true);
    try {
      const res = await AxiosConfig.post(
        `/payments/vnpay/create?bookingId=${claim.bookingId}&paymentType=WARRANTY_SUPPORT&claimId=${claim.id}`
      );
      if (res.data?.paymentUrl) {
        window.location.href = res.data.paymentUrl;
      } else {
        showToast?.("Không thể khởi tạo cổng thanh toán VNPay Sandbox, vui lòng thử lại!", "error");
      }
    } catch (err) {
      showToast?.(err.response?.data?.message || "Lỗi kết nối cổng thanh toán VNPay Sandbox!", "error");
    } finally {
      setPayingVNPay(false);
    }
  };

  // Xác nhận thanh toán phí hỗ trợ bằng VietQR
  const handleConfirmCustomerPay = async () => {
    if (!payModalClaim) return;
    setPaying(true);
    try {
      await AxiosConfig.post(`/warranty-claims/${payModalClaim.id}/customer-pay`);
      showToast?.("Đã xác nhận thanh toán thành công!", "success");
      setPayModalClaim(null);
      onClaimUpdated?.();
    } catch (err) {
      showToast?.(err.response?.data?.message || "Thanh toán thất bại, vui lòng thử lại!", "error");
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Lịch Sử &amp; Tiến Độ Yêu Cầu Bảo Hành ({claims.length})</span>
        </h3>
      </div>

      <div className="space-y-4">
        {claims.map((claim) => {
          const cfg = STATUS_CONFIG[claim.status] || STATUS_CONFIG.PENDING;
          const StatusIcon = cfg.icon;
          const images = parseImageUrls(claim.imageUrls);
          const resolvedImages = parseImageUrls(claim.resolvedImageUrls);
          const issueName = ISSUE_LABELS[claim.issueType] || claim.issueType;
          const hasSupportPrice = claim.finalSupportPrice && Number(claim.finalSupportPrice) > 0;
          const isPendingCustomerChoice = claim.status === "REJECTED" && hasSupportPrice;
          const isPaid = Boolean(claim.customerPaid || claim.customerAccepted);

          return (
            <div
              key={claim.id}
              className={`p-4 sm:p-5 rounded-2xl border space-y-3.5 text-xs transition ${
                isPendingCustomerChoice
                  ? "bg-amber-50/40 border-amber-200 shadow-xs"
                  : claim.status === "CUSTOMER_ACCEPTED_SUPPORT"
                  ? "bg-purple-50/50 border-purple-200"
                  : claim.status === "COMPLETED"
                  ? "bg-emerald-50/30 border-emerald-200"
                  : "bg-slate-50/70 border-slate-200"
              }`}
            >
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-900 text-sm">
                    Phiếu #{claim.id} • {issueName}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    ({formatDate(claim.createdAt)})
                  </span>
                </div>
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${cfg.badge}`}
                >
                  <StatusIcon className="w-3.5 h-3.5" />
                  <span>{cfg.label}</span>
                </span>
              </div>

              {/* Description */}
              <p className="text-slate-800 leading-relaxed font-medium">
                {claim.description}
              </p>

              {/* Photos do khách gửi */}
              {images.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] text-slate-500 font-bold">Ảnh hiện trường bạn gửi:</span>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {images.map((img, idx) => (
                      <div
                        key={idx}
                        onClick={() => onPreviewImage?.(img)}
                        className="aspect-square rounded-xl overflow-hidden border border-slate-200 bg-white hover:scale-105 transition cursor-pointer group relative shadow-xs"
                      >
                        <img src={img} alt="Hiện trường sự cố" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-bold">
                          🔍 Xem
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Báo cáo khảo sát của Giám sát */}
              {claim.surveyNote && (
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <ClipboardCheck className="w-4 h-4 text-blue-600" />
                      <span>Kết quả kiểm tra của Giám sát:</span>
                    </span>
                    {claim.faultType === "COMPANY_FAULT" ? (
                      <span className="text-emerald-800 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 text-[10px]">
                        🛡️ Lỗi kỹ thuật (Bảo hành 0đ)
                      </span>
                    ) : claim.faultType === "CUSTOMER_FAULT" ? (
                      <span className="text-purple-800 font-bold bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200 text-[10px]">
                        ⚠️ Lỗi khách quan ngoài BH
                      </span>
                    ) : null}
                  </div>
                  <p className="text-slate-600 leading-relaxed">{claim.surveyNote}</p>
                </div>
              )}

              {/* Ảnh nghiệm thu hoàn thành của Thợ/Giám sát */}
              {resolvedImages.length > 0 && (
                <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-2 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Hình ảnh hiện trường sau khi hoàn thành sửa chữa:</span>
                    </span>
                    {claim.resolvedAt && (
                      <span className="text-emerald-700 text-[10px]">
                        Hoàn thành: {formatDate(claim.resolvedAt)}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {resolvedImages.map((img, idx) => (
                      <div
                        key={idx}
                        onClick={() => onPreviewImage?.(img)}
                        className="aspect-square rounded-xl overflow-hidden border border-emerald-300 bg-white hover:scale-105 transition cursor-pointer group relative shadow-xs"
                      >
                        <img src={img} alt="Ảnh hoàn tất" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-bold">
                          🔍 Xem
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* KHỐI THANH TOÁN CHI PHÍ HỖ TRỢ VNPAY SANDBOX & VIETQR */}
              {hasSupportPrice && ["WORKER_COMPLETED", "COMPLETED", "IN_PROGRESS", "ACCEPTED", "CUSTOMER_ACCEPTED_SUPPORT"].includes(claim.status) && (
                <div className="p-4 bg-gradient-to-r from-blue-50 via-sky-50 to-indigo-50 rounded-2xl border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-blue-700" />
                      <span className="font-bold text-slate-900 text-xs">
                        Chi phí hỗ trợ kỹ thuật: <strong className="font-mono text-blue-700">{formatMoney(claim.finalSupportPrice)}</strong>
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      {isPaid
                        ? "✓ Bạn đã hoàn tất thanh toán chi phí hỗ trợ sửa chữa cho đơn vị thi công."
                        : "Thanh toán trực tuyến bảo mật qua cổng VNPay Sandbox hoặc quét mã VietQR ngân hàng."}
                    </p>
                  </div>

                  {isPaid ? (
                    <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-300 flex items-center gap-1.5 shrink-0">
                      <Check className="w-4 h-4" /> Đã Thanh Toán
                    </span>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={payingVNPay}
                        onClick={() => handlePayVNPaySupport(claim)}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>{payingVNPay ? "Đang kết nối..." : `VNPay Sandbox (${formatMoney(claim.finalSupportPrice)})`}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPayModalClaim(claim)}
                        className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-xl text-xs transition flex items-center gap-1.5 border border-slate-300 shadow-xs cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5 text-blue-600" />
                        <span>VietQR</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* KHỐI TƯƠNG TÁC ĐỒNG Ý / TỪ CHỐI BÁO GIÁ HỖ TRỢ */}
              {isPendingCustomerChoice && (
                <div className="p-4 bg-white rounded-2xl border border-amber-200 space-y-3 shadow-xs">
                  <div className="flex items-center gap-2 text-slate-900 font-bold">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span className="text-xs">Đề Xuất Hỗ Trợ Sửa Chữa Từ Ban Quản Trị</span>
                  </div>

                  <div className="space-y-1 text-[11px] text-slate-900 bg-amber-50/60 p-3 rounded-xl border border-amber-100">
                    <div>
                      <strong>Lý do từ chối BH miễn phí:</strong> {claim.adminNote || "Sự cố phát sinh do nguyên nhân khách quan ngoài phạm vi bảo hành màng sơn."}
                    </div>
                    <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs pt-1.5 border-t border-amber-200/60 font-mono">
                      <DollarSign className="w-4 h-4 text-blue-600" />
                      <span>Mức giá ưu đãi công ty hỗ trợ sửa chữa: {formatMoney(claim.finalSupportPrice)}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 italic">
                    Bạn có muốn công ty phân công Đội thợ chuyên nghiệp đến khắc phục với mức giá ưu đãi trên không?
                  </p>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleOpenAcceptModal(claim)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-xs flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Đồng Ý Sửa Chữa (Chọn Lịch Làm)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenDeclineModal(claim)}
                      className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-xl text-xs transition cursor-pointer border border-slate-300 flex items-center gap-1.5 shadow-xs"
                    >
                      <X className="w-4 h-4" />
                      <span>Từ Chối Hỗ Trợ</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Trạng thái đã đồng ý hỗ trợ */}
              {claim.status === "CUSTOMER_ACCEPTED_SUPPORT" && (
                <div className="p-3.5 bg-purple-50 rounded-xl border border-purple-200 text-purple-950 text-[11px] space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-purple-900">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span>Bạn đã đồng ý sửa chữa có hỗ trợ ({formatMoney(claim.finalSupportPrice)})</span>
                  </div>
                  <p className="text-purple-800">
                    Lịch hẹn mong muốn: <strong>{claim.preferredDate ? formatDate(claim.preferredDate) : "Sớm nhất"}</strong> {claim.preferredTime ? `(${claim.preferredTime})` : ""}.
                    <br />
                    Ban Quản Trị đang tiến hành phân công Đội thợ thi công theo lịch hẹn của bạn.
                  </p>
                </div>
              )}

              {/* Trạng thái đã hủy */}
              {claim.status === "CANCELLED" && (
                <div className="p-3.5 bg-slate-100 rounded-xl border border-slate-200 text-slate-600 text-[11px]">
                  Phiếu bảo hành này đã được đóng do từ chối phương án sửa chữa có hỗ trợ.
                </div>
              )}

              {/* Footer Meta / Giám sát & Thợ */}
              <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-200 text-[11px] text-slate-500">
                {claim.preferredDate && (
                  <div className="flex items-center gap-1 text-slate-800">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>
                      Hẹn ngày: <strong>{formatDate(claim.preferredDate)}</strong> {claim.preferredTime ? `(${claim.preferredTime})` : ""}
                    </span>
                  </div>
                )}

                {claim.surveyorName && (
                  <div className="flex items-center gap-1 text-slate-800">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    <span>
                      Giám sát: <strong>@{claim.surveyorName}</strong>
                    </span>
                    {claim.surveyorPhone && (
                      <a href={`tel:${claim.surveyorPhone}`} className="text-blue-600 font-bold hover:underline ml-0.5">
                        ({claim.surveyorPhone})
                      </a>
                    )}
                  </div>
                )}

                {claim.technicianName && (
                  <div className="flex items-center gap-1 text-slate-800">
                    <Wrench className="w-3.5 h-3.5 text-purple-600" />
                    <span>
                      Thợ phụ trách: <strong>@{claim.technicianName}</strong>
                    </span>
                    {claim.technicianPhone && (
                      <a
                        href={`tel:${claim.technicianPhone}`}
                        className="text-purple-600 font-bold hover:underline ml-0.5"
                      >
                        ({claim.technicianPhone})
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* NÚT SỬA & XÓA TRƯỚC KHI GIÁM SÁT NHẬN VIỆC */}
              {canEditOrDelete(claim) && (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-200">
                  <span className="text-[11px] text-amber-700 font-medium bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                    ⚡ Bạn có thể sửa hoặc xóa trước khi Giám sát tiếp nhận việc
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingClaim(claim)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-50 text-blue-600 font-bold rounded-xl text-xs transition border border-blue-200 shadow-2xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Sửa yêu cầu</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingClaim(claim)}
                      className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 font-bold rounded-xl text-xs transition border border-rose-200 shadow-2xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MODAL KHÁCH CHỌN NGÀY HẸN THI CÔNG KHI ĐỒNG Ý HỖ TRỢ */}
      {acceptModalClaim && (
        <Modal
          isOpen={Boolean(acceptModalClaim)}
          onClose={() => setAcceptModalClaim(null)}
          title={`Đồng Ý Sửa Chữa Có Hỗ Trợ #${acceptModalClaim.id}`}
          size="md"
        >
          <form onSubmit={handleSubmitAccept} className="space-y-4 text-xs">
            <div className="p-3.5 bg-purple-50 rounded-xl border border-purple-200 text-purple-950 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-purple-900">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Xác nhận sửa chữa với giá ưu đãi {formatMoney(acceptModalClaim.finalSupportPrice)}</span>
              </div>
              <p className="text-[11px] leading-relaxed text-purple-800">
                Vui lòng chọn ngày và khung giờ bạn ở nhà để công ty phân công Đội thợ đến thi công dặm vá.
              </p>
            </div>

            {actionError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold">
                {actionError}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block font-bold text-slate-900">
                Ngày Bạn Muốn Thợ Đến Thi Công <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                min={minDateStr}
                required
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium text-slate-900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-slate-900">Khung Giờ Thuận Tiện</label>
              <select
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium text-slate-900"
              >
                <option value="08:30">Buổi sáng (08:00 - 12:00)</option>
                <option value="14:00">Buổi chiều (13:30 - 17:30)</option>
                <option value="Cả ngày">Cả ngày (08:00 - 17:00)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-slate-900">Ghi chú thêm cho Thợ (nếu có)</label>
              <textarea
                rows={2}
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
                placeholder="Ví dụ: Bấm chuông cửa phòng 302, có sẵn thang nhôm..."
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAcceptModalClaim(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? "Đang gửi..." : "Xác Nhận & Gửi Yêu Cầu"}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL QUÉT MÃ VIETQR THANH TOÁN PHÍ HỖ TRỢ */}
      {payModalClaim && (
        <Modal
          isOpen={Boolean(payModalClaim)}
          onClose={() => setPayModalClaim(null)}
          title={`Thanh Toán Phí Sửa Chữa Hỗ Trợ #${payModalClaim.id}`}
          size="md"
        >
          <div className="space-y-4">
            <QRCodePayment
              amount={payModalClaim.finalSupportPrice}
              orderId={payModalClaim.bookingId}
              addInfo={`BH${payModalClaim.id} DH${payModalClaim.bookingId}`}
              title={`Quét mã VietQR thanh toán chi phí hỗ trợ`}
              subTitle={`Phiếu bảo hành #${payModalClaim.id} • Đơn #${payModalClaim.bookingId}`}
              note="Quét mã VietQR bằng App Ngân Hàng rồi bấm xác nhận để hoàn tất."
              confirmText={paying ? "Đang ghi nhận..." : `Xác nhận đã chuyển ${formatMoney(payModalClaim.finalSupportPrice)}`}
              confirmColor="bg-emerald-600 hover:bg-emerald-700"
              onConfirm={handleConfirmCustomerPay}
              onClose={() => setPayModalClaim(null)}
              loading={paying}
            />
          </div>
        </Modal>
      )}

      {/* MODAL SỬA YÊU CẦU BẢO HÀNH */}
      {editingClaim && (
        <EditWarrantyClaimModal
          isOpen={Boolean(editingClaim)}
          onClose={() => setEditingClaim(null)}
          claim={editingClaim}
          showToast={showToast}
          onSuccess={() => {
            setEditingClaim(null);
            onClaimUpdated?.();
          }}
        />
      )}

      {/* MODAL XÁC NHẬN XÓA YÊU CẦU BẢO HÀNH */}
      {deletingClaim && (
        <Modal
          isOpen={Boolean(deletingClaim)}
          onClose={() => setDeletingClaim(null)}
          title={`Xác Nhận Xóa Yêu Cầu Bảo Hành #${deletingClaim.id}`}
          size="sm"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-700 leading-relaxed">
              Bạn có chắc chắn muốn xóa yêu cầu bảo hành <strong>#{deletingClaim.id}</strong> ({ISSUE_LABELS[deletingClaim.issueType] || deletingClaim.issueType}) không?
              <br />
              <span className="text-rose-600 font-medium mt-1 block">
                Thao tác này sẽ hủy yêu cầu và xóa khỏi hệ thống.
              </span>
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingClaim(null)}
                disabled={deleting}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteClaim}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleting ? "Đang xóa..." : "Xác Nhận Xóa"}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL XÁC NHẬN TỪ CHỐI SỬA CHỮA HỖ TRỢ */}
      {declineModalClaim && (
        <Modal
          isOpen={Boolean(declineModalClaim)}
          onClose={() => setDeclineModalClaim(null)}
          title={`Từ Chối Phương Án Hỗ Trợ #${declineModalClaim.id}`}
          size="sm"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 leading-relaxed flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                Bạn có chắc chắn muốn từ chối phương án sửa chữa có hỗ trợ với mức giá{" "}
                <strong>
                  {formatMoney(
                    declineModalClaim.finalSupportPrice !== undefined &&
                      declineModalClaim.finalSupportPrice !== null
                      ? declineModalClaim.finalSupportPrice
                      : declineModalClaim.suggestedPrice
                  )}
                </strong>{" "}
                không?
              </div>
            </div>

            <p className="text-slate-600 leading-relaxed">
              Sau khi xác nhận từ chối, phiếu bảo hành <strong>#{declineModalClaim.id}</strong> sẽ được hoàn tất đóng lại và hệ thống sẽ không triển khai nhân sự đến khắc phục.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeclineModalClaim(null)}
                disabled={decliningSupport}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer transition"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                disabled={decliningSupport}
                onClick={handleConfirmDeclineSupport}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50 transition"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>{decliningSupport ? "Đang xử lý..." : "Xác Nhận Từ Chối"}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
