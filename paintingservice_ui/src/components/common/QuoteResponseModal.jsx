import React, { useState, useEffect } from "react";
import {
  X,
  FileSignature,
  MessageSquare,
  XCircle,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Check,
  Star,
  User,
  Phone,
  MapPin,
  Briefcase,
  Clock,
  Edit3,
  RotateCcw,
  Sparkles,
  Paintbrush,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import AxiosConfig from "../../util/AxiosConfig";
import { formatMoney } from "../../util/formatters";
import { formatDate, parseNegotiationInfo } from "../../util/orderFlowUtils";

// ─────────────────────────────────────────────────────────────────
// Mini component: Card chọn thợ thi công cho MỘT dịch vụ
// ─────────────────────────────────────────────────────────────────
function ServiceTechnicianPicker({
  service,
  index,
  formerTechnicians,
  allWorkers,
  selectedTechId,
  onSelect,
  loadingWorkers,
}) {
  const [expanded, setExpanded] = useState(false);
  const chosenTech =
    selectedTechId != null
      ? (formerTechnicians.find((t) => t.userId === selectedTechId) ||
          allWorkers.find((t) => t.userId === selectedTechId))
      : null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* Header - tên dịch vụ */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-5 h-5 rounded-full bg-[#1E3A8A] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
            {index + 1}
          </span>
          <span className="text-sm font-bold text-slate-900 truncate">
            {service.serviceName || `Gói dịch vụ #${index + 1}`}
          </span>
        </div>
        {(service.price && Number(service.price) > 0) ? (
          <span className="text-xs text-[#1E3A8A] font-bold font-mono shrink-0 ml-2">
            {formatMoney(service.price)}
          </span>
        ) : service.servicePrice ? (
          <span className="text-xs text-slate-500 font-medium shrink-0 ml-2">
            {formatMoney(service.servicePrice)}
          </span>
        ) : null}
      </div>

      {/* Kết quả chọn hiện tại */}
      <div className="px-4 py-3 flex items-center justify-between gap-3">
        {chosenTech ? (
          <div className="flex items-center gap-2.5 min-w-0">
            {chosenTech.avatar ? (
              <img
                src={chosenTech.avatar}
                alt={chosenTech.username}
                className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-sm flex items-center justify-center shrink-0">
                {(chosenTech.fullName || chosenTech.username || "T").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 truncate">
                {chosenTech.fullName || `@${chosenTech.username}`}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <span className="flex items-center text-amber-600 font-bold">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400 mr-0.5" />
                  {chosenTech.rating ? Number(chosenTech.rating).toFixed(1) : "5.0"}
                </span>
                <span>•</span>
                <span>{chosenTech.specialty || "Thợ sơn"}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="font-semibold">Tự động điều phối đội thợ tối ưu</span>
          </div>
        )}

        <button
          type="button"
          onClick={() => setExpanded((p) => !p)}
          className="flex items-center gap-1 text-xs text-[#1E3A8A] font-bold hover:underline shrink-0 cursor-pointer"
        >
          {expanded ? "Thu gọn" : "Thay đổi"}
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Danh sách chọn thợ - chỉ hiện khi expanded */}
      {expanded && (
        <div className="border-t border-slate-100 px-4 py-3 space-y-2">
          {/* Tự động */}
          <div
            onClick={() => { onSelect(null); setExpanded(false); }}
            className={`p-3 rounded-xl border cursor-pointer transition flex items-center gap-3 ${
              selectedTechId === null
                ? "bg-blue-50/70 border-blue-600 ring-1 ring-blue-600"
                : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${selectedTechId === null ? "bg-[#1E3A8A] text-white" : "bg-slate-100 text-slate-500"}`}>
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Hệ thống tự động điều phối (Khuyên dùng)</div>
              <div className="text-[11px] text-slate-500">Phân công đội thợ tay nghề cao nhất, sẵn sàng gần công trình</div>
            </div>
            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ml-auto shrink-0 ${selectedTechId === null ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white"}`}>
              {selectedTechId === null && <Check className="w-2.5 h-2.5 stroke-[3]" />}
            </div>
          </div>

          {/* Thợ cũ đã từng làm cho khách */}
          {formerTechnicians.length > 0 && (
            <>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pt-1">★ Thợ quen thuộc đã từng phục vụ bạn</div>
              {formerTechnicians.map((tech) => {
                const isSelected = selectedTechId === tech.userId;
                return (
                  <div
                    key={`former-${tech.userId}`}
                    onClick={() => { onSelect(tech.userId); setExpanded(false); }}
                    className={`p-3 rounded-xl border cursor-pointer transition flex items-center gap-3 ${isSelected ? "bg-blue-50/70 border-blue-600 ring-1 ring-blue-600" : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`}
                  >
                    {tech.avatar ? (
                      <img src={tech.avatar} alt={tech.username} className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm flex items-center justify-center shrink-0">
                        {(tech.fullName || tech.username || "T").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900">{tech.fullName || `@${tech.username}`}</div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <span className="flex items-center text-amber-600 font-bold"><Star className="w-3 h-3 fill-amber-400 text-amber-400 mr-0.5" />{tech.rating ? Number(tech.rating).toFixed(1) : "5.0"}</span>
                        <span>•</span><span>{tech.specialty || "Thi công sơn"}</span>
                        <span>•</span><span className={`font-semibold ${tech.available ? "text-emerald-600" : "text-slate-400"}`}>{tech.available ? "Sẵn sàng" : "Đang bận"}</span>
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white"}`}>
                      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* Thợ khác từ toàn bộ danh sách */}
          {loadingWorkers ? (
            <div className="text-center text-xs text-slate-400 py-2">Đang tải danh sách thợ...</div>
          ) : allWorkers.filter((w) => !formerTechnicians.some((ft) => ft.userId === w.userId)).length > 0 ? (
            <>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pt-1">Đội thợ chuyên nghiệp khác</div>
              {allWorkers.filter((w) => !formerTechnicians.some((ft) => ft.userId === w.userId)).map((tech) => {
                const isSelected = selectedTechId === tech.userId;
                return (
                  <div
                    key={`worker-${tech.userId}`}
                    onClick={() => { onSelect(tech.userId); setExpanded(false); }}
                    className={`p-3 rounded-xl border cursor-pointer transition flex items-center gap-3 ${isSelected ? "bg-blue-50/70 border-blue-600 ring-1 ring-blue-600" : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`}
                  >
                    {tech.avatar ? (
                      <img src={tech.avatar} alt={tech.username} className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm flex items-center justify-center shrink-0">
                        {(tech.fullName || tech.username || "T").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900">{tech.fullName || `@${tech.username}`}</div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <span className="flex items-center text-amber-600 font-bold"><Star className="w-3 h-3 fill-amber-400 text-amber-400 mr-0.5" />{tech.rating ? Number(tech.rating).toFixed(1) : "5.0"}</span>
                        <span>•</span><span>{tech.specialty || "Thi công sơn"}</span>
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white"}`}>
                      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default function QuoteResponseModal({
  isOpen,
  onClose,
  booking,
  onAccept,
  onNegotiate,
  onCancelNegotiation,
  onReject,
}) {
  const negInfo = parseNegotiationInfo(booking?.description);
  const hasActiveNeg = negInfo.hasNegotiation;

  // Kiểm tra đơn có nhiều dịch vụ không
  const bookingServices = booking?.bookingServices || [];
  const isMultiService = bookingServices.length > 1;

  // 3 tabs: 'accept' | 'negotiate' | 'reject'
  const [activeTab, setActiveTab] = useState(hasActiveNeg ? "negotiate" : "accept");
  const [isEditingNegotiation, setIsEditingNegotiation] = useState(!hasActiveNeg);

  const [selectedStartDate, setSelectedStartDate] = useState(
    booking?.expectedStartDate || new Date(Date.now() + 86400000).toISOString().split("T")[0]
  );
  const [proposedPrice, setProposedPrice] = useState("");
  const [negotiateMsg, setNegotiateMsg] = useState("");
  const [submittingNeg, setSubmittingNeg] = useState(false);
  const [cancellingNeg, setCancellingNeg] = useState(false);

  const [rejectReason, setRejectReason] = useState("");
  const [submittingReject, setSubmittingReject] = useState(false);

  // Đội thợ thi công cũ & toàn bộ danh sách thợ
  const [formerTechnicians, setFormerTechnicians] = useState([]);
  const [allWorkers, setAllWorkers] = useState([]);
  const [loadingFormer, setLoadingFormer] = useState(false);
  const [loadingWorkers, setLoadingWorkers] = useState(false);

  // Trường hợp đơn 1 dịch vụ: chọn 1 thợ chung
  const [selectedTechnicianId, setSelectedTechnicianId] = useState(null);

  // Trường hợp đơn nhiều dịch vụ: Map<serviceItemKey, technicianId|null>
  const [serviceTechMap, setServiceTechMap] = useState({});

  const handleSetTechForService = (serviceItemKey, techId) => {
    setServiceTechMap((prev) => ({ ...prev, [serviceItemKey]: techId }));
  };

  useEffect(() => {
    if (isOpen) {
      if (hasActiveNeg) {
        setActiveTab("negotiate");
        setIsEditingNegotiation(false);
        const cleanPrice = (negInfo.proposedPrice || "").replace(/[^\d]/g, "");
        setProposedPrice(cleanPrice);
        setNegotiateMsg(negInfo.message || "");
      } else {
        setActiveTab("accept");
        setIsEditingNegotiation(true);
        setProposedPrice("");
        setNegotiateMsg("");
      }
      setRejectReason("");
      setSelectedTechnicianId(booking?.preferredTechnicianId || null);

      // Khởi tạo serviceTechMap từ dữ liệu bookingServices hiện có
      if (isMultiService) {
        const initMap = {};
        bookingServices.forEach((svc) => {
          const key = svc.id || svc.serviceId;
          initMap[key] = svc.technicianId || null;
        });
        setServiceTechMap(initMap);
      }

      // Tải danh sách đội thợ cũ của khách hàng
      setLoadingFormer(true);
      AxiosConfig.get("/staff/former-technicians")
        .then((res) => setFormerTechnicians(res.data || []))
        .catch((err) => console.error("Lỗi tải danh sách thợ cũ:", err))
        .finally(() => setLoadingFormer(false));

      // Tải toàn bộ danh sách thợ (cho chế độ nhiều dịch vụ)
      setLoadingWorkers(true);
      AxiosConfig.get("/staff?staffType=WORKER")
        .then((res) => setAllWorkers(res.data || []))
        .catch((err) => console.error("Lỗi tải danh sách thợ:", err))
        .finally(() => setLoadingWorkers(false));
    }
  }, [isOpen, hasActiveNeg, booking?.description, booking?.preferredTechnicianId]);

  const total = Number(booking?.totalAmount) || 0;
  const deposit = booking?.depositAmount ? Number(booking.depositAmount) : total * 0.3;
  const remaining = Math.max(0, total - deposit);
  const today = new Date().toISOString().split("T")[0];
  const maxDate = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

  const handleClose = () => {
    onClose?.();
  };

  const handleAcceptSubmit = () => {
    if (!selectedStartDate) return;
    if (isMultiService) {
      // Gộp serviceTechMap vào bookingServices
      const updatedBookingServices = bookingServices.map((svc) => {
        const key = svc.id || svc.serviceId;
        return {
          ...svc,
          technicianId: serviceTechMap[key] ?? svc.technicianId ?? null,
        };
      });
      const firstTechId = updatedBookingServices.find((s) => s.technicianId)?.technicianId || null;
      onAccept?.(selectedStartDate, firstTechId, updatedBookingServices);
    } else {
      onAccept?.(selectedStartDate, selectedTechnicianId, null);
    }
    handleClose();
  };

  const handleNegotiateSubmit = async () => {
    if (!negotiateMsg.trim()) return;
    setSubmittingNeg(true);
    try {
      await onNegotiate?.(proposedPrice, negotiateMsg);
      handleClose();
    } finally {
      setSubmittingNeg(false);
    }
  };

  const handleCancelNegSubmit = async () => {
    setCancellingNeg(true);
    try {
      await onCancelNegotiation?.();
      handleClose();
    } finally {
      setCancellingNeg(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) return;
    setSubmittingReject(true);
    try {
      await onReject?.(rejectReason);
      handleClose();
    } finally {
      setSubmittingReject(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={handleClose} />

      {/* Modal Box */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* 1. Header (Clean Navy & Simple) */}
        <div className="bg-[#1E3A8A] text-white px-5 py-4 sm:px-6 sm:py-4.5 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-blue-200 uppercase tracking-wider">
                Phản hồi báo giá
              </span>
              <span className="text-xs text-blue-300">•</span>
              <span className="text-xs text-blue-200">Đơn #{booking?.id}</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold mt-0.5">
              Dự toán thi công: {formatMoney(total)}
            </h2>
            {isMultiService && (
              <div className="flex items-center gap-1.5 mt-1">
                <Paintbrush className="w-3.5 h-3.5 text-amber-300" />
                <span className="text-xs text-blue-200">
                  {bookingServices.length} gói dịch vụ — Phân công thợ theo từng gói
                </span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-lg hover:bg-white/15 flex items-center justify-center text-white/80 hover:text-white transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Neutral Tab Bar (3 options: Duyệt HĐ / Thương lượng / Từ chối) */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 sm:px-6 gap-2 sm:gap-4 shrink-0 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("accept")}
            className={`py-3 px-2 sm:px-3 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === "accept"
                ? "border-[#1E3A8A] text-[#1E3A8A] font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Ký Hợp Đồng ({formatMoney(total)})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("negotiate")}
            className={`py-3 px-2 sm:px-3 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === "negotiate"
                ? "border-[#1E3A8A] text-[#1E3A8A] font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <span>Thương lượng giá</span>
            {hasActiveNeg && (
              <span className="w-2 h-2 rounded-full bg-blue-600" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("reject")}
            className={`py-3 px-2 sm:px-3 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === "reject"
                ? "border-[#1E3A8A] text-[#1E3A8A] font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <XCircle className="w-4 h-4 text-slate-400" />
            <span>Từ chối</span>
          </button>
        </div>

        {/* 3. Tab Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5 text-sm">
          {/* ========================================================================= */}
          {/* TAB 1: KÝ HỢP ĐỒNG & CHỌN ĐỘI THỢ                                        */}
          {/* ========================================================================= */}
          {activeTab === "accept" && (
            <div className="space-y-4">
              {/* Tóm tắt thanh toán ngắn gọn, trung tính */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Tổng dự toán</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">{formatMoney(total)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Tiền cọc đợt 1 (30%)</span>
                  <span className="font-bold text-blue-700 text-sm mt-0.5 block">{formatMoney(deposit)}</span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-slate-500 block">Tất toán khi nghiệm thu (70%)</span>
                  <span className="font-semibold text-slate-700 text-sm mt-0.5 block">{formatMoney(remaining)}</span>
                </div>
              </div>

              {/* Lịch khởi công */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Ngày bắt đầu thi công mong muốn <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    value={selectedStartDate}
                    min={today}
                    max={maxDate}
                    onChange={(e) => setSelectedStartDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-[#1E3A8A] focus:border-[#1E3A8A] outline-none transition bg-white"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Vui lòng chọn ngày trong vòng 30 ngày tới. Đội thợ sẽ có mặt lúc 08:00 sáng.
                </p>
              </div>

              {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
              {/* PHÂN CÔNG ĐỘI THỢ: 2 chế độ tuỳ số dịch vụ trong đơn   */}
              {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
              {isMultiService ? (
                /* ── CHẾ ĐỘ NHIỀU DỊCH VỤ: Phân công thợ cho từng dịch vụ ── */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">
                      Phân công đội thợ theo từng gói dịch vụ
                    </label>
                    <span className="text-[11px] font-bold text-[#1E3A8A] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                      {bookingServices.length} gói
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Quý khách có thể chỉ định đội thợ riêng cho từng loại dịch vụ, hoặc để hệ thống tự động phân bổ tối ưu cho mỗi gói.
                  </p>

                  <div className="space-y-2.5">
                    {bookingServices.map((svc, idx) => {
                      const key = svc.id || svc.serviceId;
                      return (
                        <ServiceTechnicianPicker
                          key={key || idx}
                          service={svc}
                          index={idx}
                          formerTechnicians={formerTechnicians}
                          allWorkers={allWorkers}
                          selectedTechId={key in serviceTechMap ? serviceTechMap[key] : (svc.technicianId || null)}
                          onSelect={(techId) => handleSetTechForService(key, techId)}
                          loadingWorkers={loadingWorkers}
                        />
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* ── CHẾ ĐỘ MỘT DỊCH VỤ: Chọn thợ chung cho toàn đơn ── */
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">
                      Lựa chọn đội thợ thi công
                    </label>
                    {formerTechnicians.length > 0 && (
                      <span className="text-xs text-blue-700 font-medium">
                        Tìm thấy {formerTechnicians.length} đội thợ đã từng làm cho bạn
                      </span>
                    )}
                  </div>

                  {/* Option 1: Hệ thống tự động phân bổ tối ưu */}
                  <div
                    onClick={() => setSelectedTechnicianId(null)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start justify-between gap-3 ${
                      selectedTechnicianId === null
                        ? "bg-blue-50/60 border-blue-600 ring-1 ring-blue-600"
                        : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-sm ${selectedTechnicianId === null ? "bg-[#1E3A8A] text-white" : "bg-slate-100 text-slate-600"}`}>
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm">Hệ thống tự động điều phối đội thợ tối ưu (Khuyên dùng)</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">Tự động</span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Precision Paint sẽ chỉ định đội thợ có tay nghề cao, điểm đánh giá cao nhất và đang sẵn sàng gần công trình của bạn sau khi cọc 30%.
                        </p>
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-1 ${selectedTechnicianId === null ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white"}`}>
                      {selectedTechnicianId === null && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                  </div>

                  {/* Option 2: Chọn từ danh sách đội thợ cũ */}
                  {loadingFormer ? (
                    <div className="p-4 text-center text-xs text-slate-400">Đang tải danh sách thợ cũ...</div>
                  ) : formerTechnicians.length > 0 ? (
                    <div className="space-y-2 pt-2">
                      <span className="text-xs font-bold text-slate-700 block">Hoặc chọn đội thợ quen thuộc đã từng phục vụ bạn:</span>
                      <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                        {formerTechnicians.map((tech) => {
                          const isSelected = selectedTechnicianId === tech.userId;
                          return (
                            <div
                              key={tech.userId}
                              onClick={() => setSelectedTechnicianId(tech.userId)}
                              className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start justify-between gap-3 ${isSelected ? "bg-blue-50/60 border-blue-600 ring-1 ring-blue-600" : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"}`}
                            >
                              <div className="flex items-start gap-3 min-w-0 flex-1">
                                {tech.avatar ? (
                                  <img src={tech.avatar} alt={tech.fullName || tech.username} className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0" />
                                ) : (
                                  <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm flex items-center justify-center shrink-0 border border-slate-200">
                                    {(tech.fullName || tech.username || "T").charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div className="space-y-1 min-w-0 flex-1 text-xs">
                                  <div className="flex items-center gap-2 flex-wrap justify-between">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-bold text-slate-900 text-sm">{tech.fullName || `@${tech.username}`}</span>
                                      {tech.fullName && <span className="text-slate-500 font-mono text-[11px]">(@{tech.username})</span>}
                                    </div>
                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${tech.available ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-600 border border-slate-200"}`}>
                                      {tech.available ? "Sẵn sàng nhận việc" : "Đang bận"}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 flex-wrap text-slate-600 text-[11px]">
                                    <span className="flex items-center font-bold text-amber-600"><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-0.5" />{tech.rating ? Number(tech.rating).toFixed(1) : "5.0"}</span>
                                    <span>•</span><span>{tech.experienceYears || 3} năm kinh nghiệm</span>
                                    <span>•</span><span className="font-medium text-slate-800">{tech.specialty || "Thi công sơn nhà"}</span>
                                  </div>
                                  <div className="flex items-center gap-3 flex-wrap text-slate-500 text-[11px]">
                                    {tech.serviceArea && <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-400" /><span>Khu vực: {tech.serviceArea}</span></span>}
                                    {tech.phoneNumber && <span className="flex items-center gap-1 font-mono text-slate-600"><Phone className="w-3 h-3 text-slate-400" /><span>{tech.phoneNumber}</span></span>}
                                  </div>
                                  <div className="pt-1 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap text-[11px]">
                                    <span className="text-blue-700 font-medium">Đã hoàn thành <strong className="font-bold">{tech.bookingCountWithCustomer || 1}</strong> công trình cho bạn</span>
                                    {tech.lastServiceName && <span className="text-slate-400 truncate max-w-[200px]" title={tech.lastServiceName}>Gần nhất: {tech.lastServiceName}</span>}
                                  </div>
                                </div>
                              </div>
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-1 ${isSelected ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white"}`}>
                                {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                      Bạn chưa có đội thợ quen trong lịch sử. Hệ thống sẽ tự động phân công đội thợ tay nghề cao nhất khi bạn hoàn tất đặt cọc.
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleAcceptSubmit}
                  disabled={!selectedStartDate}
                  className="px-5 py-2.5 rounded-xl bg-[#1E3A8A] hover:bg-[#1e40a6] text-white font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <FileSignature className="w-4 h-4" />
                  <span>Xác Nhận &amp; Ký Hợp Đồng</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: THƯƠNG LƯỢNG GIÁ (TRUNG TÍNH, ĐƠN GIẢN, DỄ NHÌN)                   */}
          {/* ========================================================================= */}
          {activeTab === "negotiate" && (
            <div className="space-y-4">
              {/* Nếu đã có đề xuất đang chờ xử lý và không ở chế độ sửa */}
              {hasActiveNeg && !isEditingNegotiation ? (
                <div className="space-y-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <span className="font-bold text-slate-800 text-xs flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                        Đề xuất thương lượng đang chờ Admin phản hồi
                      </span>
                      <span className="text-[11px] font-semibold text-slate-600 bg-slate-200 px-2.5 py-0.5 rounded-full">
                        Đang xử lý
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <span className="text-slate-400 font-medium block">Báo giá gốc ban đầu</span>
                        <strong className="text-slate-800 text-sm block mt-0.5">{formatMoney(total)}</strong>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-blue-200">
                        <span className="text-blue-600 font-medium block">Giá bạn đề xuất</span>
                        <strong className="text-blue-700 text-sm block mt-0.5">
                          {negInfo.proposedPrice || "Chưa ghi số tiền"}
                        </strong>
                      </div>
                    </div>

                    {negInfo.message && (
                      <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs text-slate-700 space-y-1">
                        <span className="text-slate-400 font-medium block text-[11px]">Lý do / Nội dung bạn đã gửi:</span>
                        <p className="leading-relaxed whitespace-pre-wrap">{negInfo.message}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleCancelNegSubmit}
                      disabled={cancellingNeg}
                      className="px-4 py-2.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 font-semibold text-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{cancellingNeg ? "Đang hủy..." : "Hủy đề xuất (Dùng giá gốc)"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsEditingNegotiation(true)}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Chỉnh sửa nội dung</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Form nhập đề xuất thương lượng mới hoặc sửa */
                <div className="space-y-4">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    <p className="font-bold text-slate-800">
                      Báo giá dự toán hiện tại: <span className="font-mono text-sm">{formatMoney(total)}</span>
                    </p>
                    <p className="text-slate-500 leading-relaxed">
                      Bạn có thể đề xuất mức giá mong muốn hoặc gửi ghi chú điều chỉnh hạng mục. Quản trị viên sẽ xem xét và phản hồi qua số điện thoại hoặc cập nhật lại báo giá.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Mức giá bạn mong muốn (VNĐ) — Không bắt buộc
                    </label>
                    <input
                      type="number"
                      value={proposedPrice}
                      onChange={(e) => setProposedPrice(e.target.value)}
                      placeholder={`Ví dụ: ${Math.round(total * 0.9).toLocaleString("vi-VN")}`}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-[#1E3A8A] focus:border-[#1E3A8A] outline-none transition bg-white"
                    />
                    {proposedPrice && !isNaN(proposedPrice) && (
                      <p className="text-[11px] text-blue-700 font-medium mt-1">
                        Tương đương: {Number(proposedPrice).toLocaleString("vi-VN")} đ
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Lý do hoặc mong muốn điều chỉnh <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      value={negotiateMsg}
                      onChange={(e) => setNegotiateMsg(e.target.value)}
                      rows={3}
                      placeholder="Ví dụ: Tôi muốn giảm bớt hạng mục sơn dặm trần, hoặc mong muốn mức giá ưu đãi hơn..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 resize-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-[#1E3A8A] outline-none transition leading-relaxed bg-white"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                    {hasActiveNeg && (
                      <button
                        type="button"
                        onClick={() => setIsEditingNegotiation(false)}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition cursor-pointer"
                      >
                        Quay lại
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleClose}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition cursor-pointer"
                    >
                      Đóng
                    </button>
                    <button
                      type="button"
                      onClick={handleNegotiateSubmit}
                      disabled={submittingNeg || !negotiateMsg.trim()}
                      className="px-5 py-2.5 rounded-xl bg-[#1E3A8A] hover:bg-[#1e40a6] text-white font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>{submittingNeg ? "Đang gửi..." : hasActiveNeg ? "Lưu Thay Đổi" : "Gửi Đề Xuất"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: TỪ CHỐI BÁO GIÁ                                                    */}
          {/* ========================================================================= */}
          {activeTab === "reject" && (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs text-slate-600">
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Xác nhận từ chối báo giá công trình</span>
                </p>
                <p className="leading-relaxed">
                  Nếu từ chối báo giá, yêu cầu dịch vụ này sẽ kết thúc. Bạn luôn có thể tạo yêu cầu mới hoặc liên hệ hotline để được tư vấn thêm bất kỳ lúc nào.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Lý do từ chối báo giá <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  placeholder="Ví dụ: Giá báo chưa phù hợp với ngân sách gia đình, hoặc tôi đã tìm được phương án khác..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 resize-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 outline-none transition leading-relaxed bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleRejectSubmit}
                  disabled={submittingReject || !rejectReason.trim()}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  <span>{submittingReject ? "Đang xử lý..." : "Xác Nhận Từ Chối"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
