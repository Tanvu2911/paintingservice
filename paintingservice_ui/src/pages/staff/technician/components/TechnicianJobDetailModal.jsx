import React, { useState } from "react";
import {
  X,
  User,
  Phone,
  MapPin,
  Calendar,
  ExternalLink,
  Copy,
  CheckCheck,
  Camera,
  Check,
  XCircle,
  Play,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  Wrench,
  FileText,
} from "lucide-react";
import StatusBadge from "../../../../components/common/StatusBadge";
import { formatMoney } from "../../../../util/formatters";
import { formatDate } from "../../../../util/orderFlowUtils";

export default function TechnicianJobDetailModal({
  selectedJob,
  selectedDetail,
  loadingDetail,
  viewTab = "overview",
  setViewTab,
  splitImageUrls,
  setSelectedPreviewImage,
  closeModal,
  onAccept,
  onReject,
  onStart,
  onComplete,
}) {
  const [copied, setCopied] = useState("");

  const handleCopy = (text, type) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(""), 2000);
  };

  if (!selectedJob) return null;

  const status = selectedJob.status || "";
  const totalAmount = Number(selectedJob.totalAmount) || 0;
  const workerPayout = totalAmount > 0 ? totalAmount * 0.6 : 0;

  // Quyền thao tác của Đội thợ
  const canAccept = ["CONTRACT_APPROVED", "DEPOSIT_CONFIRMED", "ASSIGNED"].includes(status);
  const canReject = ["CONTRACT_APPROVED", "DEPOSIT_CONFIRMED", "ASSIGNED", "ACCEPTED"].includes(
    status
  );
  const canStart = status === "ACCEPTED";
  const canComplete = status === "PROCESSING";
  const isWaitingAcceptance = status === "WORKER_COMPLETED";
  const isDone = ["WAITING_FINAL_PAYMENT", "COMPLETED", "PAID_TO_STAFF"].includes(status);

  const supervisorName = selectedJob.surveyorName || selectedJob.supervisorName;
  const supervisorPhone = selectedJob.surveyorPhone || selectedJob.supervisorPhone;
  const surveyImages = splitImageUrls ? splitImageUrls(selectedDetail?.surveyImages) : [];

  // Chuẩn hóa tab active ("info" -> "overview")
  const activeTab = viewTab === "info" || !viewTab ? "overview" : viewTab;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">

        {/* 1. Header gọn gàng */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-mono font-bold text-xs bg-blue-600 text-white px-2.5 py-1 rounded-md">
              #{selectedJob.id}
            </span>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
              {selectedJob.serviceName || selectedJob.service?.name || "Công trình thi công"}
            </h3>
            <StatusBadge status={status} />
          </div>

          <button
            type="button"
            onClick={closeModal}
            className="w-8 h-8 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Dòng tóm tắt nhanh (3 thông tin quan trọng nhất) */}
        <div className="grid grid-cols-3 divide-x divide-slate-200 border-b border-slate-200 bg-white text-center py-3 px-4">
          <div className="px-2">
            <span className="text-xs text-slate-500 font-medium block">Ngày thi công</span>
            <span className="font-semibold text-slate-900 text-sm block mt-0.5 truncate">
              {formatDate(selectedJob.expectedStartDate || selectedJob.appointmentDate)}
            </span>
          </div>
          <div className="px-2">
            <span className="text-xs text-slate-500 font-medium block">Thù lao thợ (60%)</span>
            <span className="font-bold text-emerald-600 font-mono text-base block mt-0.5">
              {workerPayout > 0 ? formatMoney(workerPayout) : "Chưa có dự toán"}
            </span>
          </div>
          <div className="px-2">
            <span className="text-xs text-slate-500 font-medium block">Thanh toán</span>
            <span className="font-semibold text-slate-900 text-sm block mt-0.5 truncate">
              {status === "PAID_TO_STAFF" ? "✓ Đã quyết toán" : "Ví thợ / Ngân hàng"}
            </span>
          </div>
        </div>

        {/* 3. Tab chuyển đổi đơn giản */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50 gap-6 text-sm font-semibold">
          <button
            type="button"
            onClick={() => setViewTab("overview")}
            className={`py-3 border-b-2 transition cursor-pointer ${
              activeTab === "overview"
                ? "border-blue-600 text-blue-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Thông tin &amp; Địa chỉ
          </button>
          <button
            type="button"
            onClick={() => setViewTab("technical")}
            className={`py-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "technical"
                ? "border-blue-600 text-blue-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>Kỹ thuật &amp; Vật tư</span>
            {surveyImages.length > 0 && (
              <span className="bg-slate-200 text-slate-700 rounded-full px-2 py-0.5 text-xs font-bold">
                {surveyImages.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setViewTab("financial")}
            className={`py-3 border-b-2 transition cursor-pointer ${
              activeTab === "financial"
                ? "border-blue-600 text-blue-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Thù lao &amp; Quyết toán
          </button>
        </div>

        {/* 4. Thân nội dung (cuộn mượt, chữ rõ, không rối) */}
        <div className="p-6 overflow-y-auto flex-1 text-sm space-y-5">
          {loadingDetail && (
            <div className="text-center py-2 text-slate-400 italic">Đang tải chi tiết...</div>
          )}

          {/* TAB 1: THÔNG TIN & ĐỊA CHỈ */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              {/* Khách hàng & Địa chỉ */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <span>
                      Chủ nhà: <strong className="text-slate-900">{selectedJob.customerName || selectedJob.customer?.username || "Khách hàng"}</strong>
                    </span>
                  </span>
                  {selectedJob.customerPhone && (
                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${selectedJob.customerPhone}`}
                        className="font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-blue-200 transition font-mono text-sm"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{selectedJob.customerPhone}</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => handleCopy(selectedJob.customerPhone, "phone")}
                        className="p-1.5 text-slate-400 hover:text-slate-700 bg-white border border-slate-200 rounded-lg cursor-pointer transition"
                        title="Sao chép SĐT"
                      >
                        {copied === "phone" ? <CheckCheck className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-start justify-between gap-3 pt-3 border-t border-slate-200">
                  <div className="flex items-start gap-2 text-slate-700 text-sm">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span className="break-words font-medium">{selectedJob.address || "Chưa có địa chỉ"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedJob.address, "addr")}
                      className="text-xs text-slate-600 hover:text-slate-900 bg-white px-2.5 py-1 rounded-md border border-slate-200 cursor-pointer font-medium"
                    >
                      {copied === "addr" ? "Đã chép" : "Sao chép"}
                    </button>
                    {selectedJob.address && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedJob.address)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-600 hover:underline bg-white px-2.5 py-1 rounded-md border border-blue-200 flex items-center gap-1 font-medium"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Bản đồ</span>
                      </a>
                    )}
                  </div>
                </div>

                {selectedJob.description && (
                  <div className="pt-2 border-t border-slate-200 text-slate-700">
                    <span className="text-xs text-slate-500 font-medium block mb-1">Ghi chú từ khách: </span>
                    <p className="bg-white p-3.5 rounded-lg border border-slate-200 text-slate-800 italic leading-relaxed whitespace-pre-wrap text-sm">
                      "{selectedJob.description}"
                    </p>
                  </div>
                )}
              </div>

              {/* Giám sát viên phụ trách */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span className="text-slate-600">Giám sát phụ trách:</span>
                  <strong className="text-slate-900 font-semibold">
                    {supervisorName || "Giám sát viên hệ thống"}
                  </strong>
                </div>
                {supervisorPhone ? (
                  <a
                    href={`tel:${supervisorPhone}`}
                    className="text-slate-800 hover:text-blue-600 flex items-center gap-1.5 font-mono font-medium bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-sm"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{supervisorPhone}</span>
                  </a>
                ) : (
                  <span className="text-slate-400 italic">Hotline công ty</span>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: KỸ THUẬT & VẬT TƯ */}
          {activeTab === "technical" && (
            <div className="space-y-4">
              {/* Thông tin gói dịch vụ & Dự kiến thời gian */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-sm">
                <div>
                  <span className="text-slate-600">Dịch vụ thi công: </span>
                  <strong className="text-slate-900 font-bold">{selectedJob.serviceName || "Sơn hoàn thiện"}</strong>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  {selectedJob.estimatedDays && (
                    <span>Thời gian dự kiến: <strong className="text-slate-900 font-semibold">{selectedJob.estimatedDays} ngày</strong></span>
                  )}
                  {selectedJob.warrantyYears && (
                    <span>Bảo hành: <strong className="text-slate-900 font-semibold">{selectedJob.warrantyYears} năm</strong></span>
                  )}
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4 bg-white shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="font-bold text-slate-800 text-sm uppercase tracking-wide">
                    Hướng Dẫn Kỹ Thuật &amp; Định Lượng Vật Tư (Từ Giám Sát)
                  </span>
                  {selectedDetail?.supervisorAccepted && (
                    <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-md">
                      ✓ Giám sát đã duyệt
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <span className="text-xs font-bold text-slate-700 block uppercase tracking-wide">
                      Hiện trạng bề mặt &amp; Yêu cầu thi công:
                    </span>
                    <p className="text-slate-800 whitespace-pre-wrap leading-relaxed min-h-[65px] text-sm">
                      {selectedDetail?.surveyNote || "Thi công chuẩn theo quy trình sơn 1 lót 2 phủ."}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <span className="text-xs font-bold text-slate-700 block uppercase tracking-wide">
                      Chủng loại sơn &amp; Vật tư cấp:
                    </span>
                    <p className="text-slate-800 whitespace-pre-wrap leading-relaxed min-h-[65px] text-sm">
                      {selectedDetail?.materialNote || "Sử dụng sơn và dụng cụ theo định mức công ty cấp."}
                    </p>
                  </div>
                </div>

                {/* Vật tư phát sinh / thiếu hụt nếu có */}
                {selectedDetail?.materialShortage && (
                  <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 space-y-1.5 text-sm">
                    <span className="font-bold text-amber-900 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Ghi chú vật tư phát sinh / thiếu hụt từ Giám sát:</span>
                    </span>
                    <p className="text-amber-900 whitespace-pre-wrap leading-relaxed">
                      {selectedDetail.materialShortage}
                    </p>
                  </div>
                )}

                {/* Danh sách ảnh khảo sát hiện trường trước khi làm */}
                {surveyImages.length > 0 && (
                  <div className="pt-3 border-t border-slate-100">
                    <span className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wide block mb-2.5">
                      Ảnh chụp hiện trường trước khi thi công ({surveyImages.length} ảnh):
                    </span>
                    <div className="flex flex-wrap gap-3">
                      {surveyImages.map((url, idx) => (
                        <div
                          key={idx}
                          onClick={() => setSelectedPreviewImage?.(url)}
                          className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-slate-200 cursor-pointer hover:border-blue-500 transition group relative shadow-2xs"
                        >
                          <img src={url} alt={`survey-${idx}`} className="w-full h-full object-cover group-hover:scale-105 transition" />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                            <Maximize2 className="w-4 h-4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: THÙ LAO & QUYẾT TOÁN */}
          {activeTab === "financial" && (
            <div className="space-y-4">
              {/* Thù lao thợ */}
              <div className="p-4 sm:p-5 bg-slate-900 text-white rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block uppercase font-medium">Thù lao thi công (60%)</span>
                  <span className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400 mt-0.5 block">
                    {workerPayout > 0 ? formatMoney(workerPayout) : "Chưa có dự toán"}
                  </span>
                </div>
                <span className="text-xs text-slate-300">Quyết toán sau khi nghiệm thu</span>
              </div>

              {/* Bảng phân bổ */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 text-sm">
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-600">Mức thù lao nhận được:</span>
                  <strong className="font-mono text-emerald-700 text-sm sm:text-base font-bold">
                    {workerPayout > 0 ? formatMoney(workerPayout) : "Theo hợp đồng"}
                  </strong>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-600">Hình thức chi trả:</span>
                  <span className="font-semibold text-slate-800">Ví thợ / Tài khoản ngân hàng</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-600">Điều kiện nhận thù lao:</span>
                  <span className="font-semibold text-slate-800">Báo hoàn thành &amp; Giám sát nghiệm thu</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Trạng thái quyết toán:</span>
                  <span
                    className={`font-bold px-2.5 py-1 rounded-md text-xs ${
                      status === "PAID_TO_STAFF"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {status === "PAID_TO_STAFF" ? "✓ Đã quyết toán vào ví" : "Chờ hoàn thành & quyết toán"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 5. Footer: Nút hành động trực tiếp, to rõ, dễ bấm */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={closeModal}
            className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 text-sm transition cursor-pointer"
          >
            Đóng
          </button>

          <div className="flex items-center gap-2.5">
            {canAccept && (
              <>
                {canReject && (
                  <button
                    type="button"
                    onClick={() => {
                      closeModal();
                      onReject?.(selectedJob.id);
                    }}
                    className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 text-sm transition cursor-pointer"
                  >
                    Từ chối
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    closeModal();
                    onAccept?.(selectedJob.id);
                  }}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition shadow-sm cursor-pointer"
                >
                  Nhận việc
                </button>
              </>
            )}

            {canStart && (
              <button
                type="button"
                onClick={() => {
                  closeModal();
                  onStart?.(selectedJob);
                }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Bắt đầu thi công</span>
              </button>
            )}

            {canComplete && (
              <button
                type="button"
                onClick={() => {
                  closeModal();
                  onComplete?.(selectedJob.id);
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Báo Hoàn Thành Thi Công</span>
              </button>
            )}

            {isWaitingAcceptance && (
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-800 bg-amber-50 px-3.5 py-2 rounded-xl border border-amber-200">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Đang chờ Giám sát nghiệm thu</span>
              </span>
            )}

            {isDone && (
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Công trình hoàn tất 100%</span>
              </span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
