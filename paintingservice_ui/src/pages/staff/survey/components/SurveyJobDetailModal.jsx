import React, { useState } from "react";
import {
  X,
  User,
  Phone,
  MapPin,
  Calendar,
  Clock,
  ExternalLink,
  Copy,
  CheckCheck,
  Camera,
  FileText,
  FileSignature,
  Check,
  XCircle,
  Award,
  Maximize2,
  Wrench,
  DollarSign,
  AlertCircle,
  ShieldCheck,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
} from "lucide-react";
import StatusBadge from "../../../../components/common/StatusBadge";
import { formatMoney } from "../../../../util/formatters";
import { formatDate } from "../../../../util/orderFlowUtils";

export default function SurveyJobDetailModal({
  selectedJob,
  selectedDetail,
  loadingDetail,
  viewTab = "overview",
  setViewTab,
  dailyReports = [],
  loadingDailyReports = false,
  contractData,
  splitImageUrls,
  setSelectedPreviewImage,
  closeModal,
  onAcceptJob,
  onRejectJob,
  onOpenReport,
  onOpenDaily,
  onOpenDailyReport,
  onOpenAgreement,
  onSupervisorAccept,
}) {
  const [copied, setCopied] = useState("");
  const handleOpenDaily = onOpenDailyReport || onOpenDaily;

  const handleCopy = (text, type) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(""), 2000);
  };

  if (!selectedJob) return null;

  const status = selectedJob.status || "PENDING";
  const totalAmount = Number(selectedJob.totalAmount) || 0;
  const supervisorPayout = totalAmount > 0 ? totalAmount * 0.1 : 0;
  const workerPayout = totalAmount * 0.6;

  // Quyền thao tác
  const canAccept = ["PENDING", "SURVEY_ASSIGNED"].includes(status);
  const canReject = ["PENDING", "SURVEY_ASSIGNED", "ACCEPTED"].includes(status);
  const canReport = ["ACCEPTED", "SURVEYING"].includes(status);
  const canAgreement = ["ACCEPTED", "SURVEYING"].includes(status);
  const canDailyReport = ["CONTRACT_APPROVED", "ASSIGNED", "PROCESSING"].includes(status);
  const canSupervisorAccept =
    status === "WORKER_COMPLETED" && (!selectedDetail || !selectedDetail.supervisorAccepted);

  const surveyImages = splitImageUrls ? splitImageUrls(selectedDetail?.surveyImages) : [];

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
              {selectedJob.serviceName || "Khảo sát công trình sơn"}
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

        {/* 2. Dòng tóm tắt nhanh (3 thông tin chính) */}
        <div className="grid grid-cols-3 divide-x divide-slate-200 border-b border-slate-200 bg-white text-center py-3 px-4">
          <div className="px-2">
            <span className="text-xs text-slate-500 font-medium block">Lịch hẹn khảo sát</span>
            <span className="font-semibold text-slate-900 text-sm block mt-0.5 truncate">
              {selectedJob.appointmentDate ? formatDate(selectedJob.appointmentDate) : "Chưa đặt"}
              {selectedJob.appointmentTime && ` • ${selectedJob.appointmentTime.slice(0, 5)}`}
            </span>
          </div>
          <div className="px-2">
            <span className="text-xs text-slate-500 font-medium block">Thù lao giám sát (10%)</span>
            <span className="font-bold text-emerald-600 font-mono text-base block mt-0.5">
              {formatMoney(supervisorPayout)}
            </span>
          </div>
          <div className="px-2">
            <span className="text-xs text-slate-500 font-medium block">Giá trị công trình</span>
            <span className="font-bold text-slate-900 font-mono text-sm sm:text-base block mt-0.5 truncate">
              {totalAmount > 0 ? formatMoney(totalAmount) : "Chưa báo giá"}
            </span>
          </div>
        </div>

        {/* 3. Tab chuyển đổi đơn giản */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50 gap-6 text-sm font-semibold">
          <button
            type="button"
            onClick={() => setViewTab("overview")}
            className={`py-3 border-b-2 transition cursor-pointer ${
              viewTab === "overview"
                ? "border-blue-600 text-blue-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Thông tin &amp; Khảo sát
          </button>
          <button
            type="button"
            onClick={() => setViewTab("daily")}
            className={`py-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              viewTab === "daily"
                ? "border-blue-600 text-blue-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>Tiến độ thi công</span>
            {dailyReports.length > 0 && (
              <span className="bg-slate-200 text-slate-700 rounded-full px-2 py-0.5 text-xs font-bold">
                {dailyReports.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setViewTab("contract")}
            className={`py-3 border-b-2 transition cursor-pointer ${
              viewTab === "contract"
                ? "border-blue-600 text-blue-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Hợp đồng &amp; Thù lao
          </button>
        </div>

        {/* 4. Thân nội dung (đầy đủ thông tin khảo sát, gọn gàng, rõ nét) */}
        <div className="p-6 overflow-y-auto flex-1 text-sm space-y-5">
          {loadingDetail && (
            <div className="text-center py-2 text-slate-400 italic">Đang tải chi tiết hồ sơ...</div>
          )}

          {/* TAB 1: THÔNG TIN & KHẢO SÁT CHI TIẾT */}
          {viewTab === "overview" && (
            <div className="space-y-5">
              {/* 1.1 Chi tiết Lịch hẹn & Dịch vụ */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200 space-y-3">
                <span className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>Kế Hoạch Khảo Sát &amp; Dịch Vụ Đã Đặt</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                    <span className="text-xs text-slate-500 font-medium block">Dịch vụ yêu cầu</span>
                    <strong className="text-slate-900 text-sm block mt-1 truncate" title={selectedJob.serviceName}>
                      {selectedJob.serviceName || "Khảo sát công trình sơn"}
                    </strong>
                  </div>

                  <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                    <span className="text-xs text-slate-500 font-medium block">Thời gian hẹn</span>
                    <strong className="text-slate-900 text-sm block mt-1">
                      {selectedJob.appointmentDate ? formatDate(selectedJob.appointmentDate) : "Chưa đặt"}
                      {selectedJob.appointmentTime && ` • ${selectedJob.appointmentTime.slice(0, 5)}`}
                    </strong>
                  </div>

                  <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                    <span className="text-xs text-slate-500 font-medium block">Thời gian tạo đơn</span>
                    <span className="text-slate-800 text-sm font-medium block mt-1 truncate">
                      {selectedJob.createdAt ? new Date(selectedJob.createdAt).toLocaleDateString("vi-VN") : "Hôm nay"}
                    </span>
                  </div>
                </div>

                {/* Giám sát viên ưu tiên & Thời gian thi công dự kiến nếu có */}
                <div className="flex flex-wrap items-center gap-4 text-sm pt-1">
                  {selectedJob.preferredSupervisorName && (
                    <span className="text-slate-600">
                      Giám sát viên ưu tiên: <strong className="text-blue-700 font-bold">@{selectedJob.preferredSupervisorName}</strong>
                    </span>
                  )}
                  {selectedJob.estimatedDays && (
                    <span className="text-slate-600">
                      Thời gian dự kiến: <strong className="text-slate-800 font-semibold">{selectedJob.estimatedDays} ngày</strong>
                    </span>
                  )}
                  {selectedJob.warrantyYears && (
                    <span className="text-slate-600">
                      Bảo hành cam kết: <strong className="text-slate-800 font-semibold">{selectedJob.warrantyYears} năm</strong>
                    </span>
                  )}
                </div>
              </div>

              {/* 1.2 Khách hàng & Địa điểm công trình */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <span>Khách hàng: <strong className="text-slate-900">{selectedJob.customerName || "Khách hàng"}</strong></span>
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
                    <span className="text-xs text-slate-500 font-medium block mb-1">Mô tả ban đầu từ khách:</span>
                    <p className="bg-white p-3.5 rounded-lg border border-slate-200 text-slate-800 italic leading-relaxed whitespace-pre-wrap text-sm">
                      "{selectedJob.description}"
                    </p>
                  </div>
                )}
              </div>

              {/* 1.3 Biên Bản Khảo Sát Hiện Trường Chi Tiết */}
              <div className="border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4 bg-white shadow-xs">
                <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100 gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-slate-800 text-sm uppercase tracking-wider">
                      Biên Bản Đo Đạc Khảo Sát &amp; Dự Toán Vật Tư
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedDetail?.supervisorAccepted ? (
                      <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-md">
                        ✓ Giám sát đã duyệt
                      </span>
                    ) : (
                      <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md">
                        Chưa duyệt
                      </span>
                    )}
                    {selectedDetail?.customerAccepted && (
                      <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2.5 py-1 rounded-md">
                        ✓ Khách đã đồng thuận
                      </span>
                    )}
                    {canReport && (
                      <button
                        type="button"
                        onClick={() => onOpenReport?.(selectedJob)}
                        className="text-blue-600 hover:underline font-bold text-sm flex items-center gap-1 cursor-pointer ml-1"
                      >
                        <FileText className="w-4 h-4" />
                        <span>{selectedDetail?.surveyNote ? "Sửa báo cáo" : "+ Lập báo cáo khảo sát"}</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  {/* Hiện trạng */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <span className="text-xs font-bold text-slate-700 block uppercase tracking-wide">
                      1. Hiện trạng màng sơn &amp; Đo đạc diện tích
                    </span>
                    <p className="text-slate-800 leading-relaxed whitespace-pre-wrap min-h-[70px] text-sm">
                      {selectedDetail?.surveyNote || "Chưa ghi nhận thông tin đo đạc hiện trường."}
                    </p>
                  </div>

                  {/* Vật tư */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <span className="text-xs font-bold text-slate-700 block uppercase tracking-wide">
                      2. Dự toán chủng loại vật tư &amp; Định mức sơn
                    </span>
                    <p className="text-slate-800 leading-relaxed whitespace-pre-wrap min-h-[70px] text-sm">
                      {selectedDetail?.materialNote || "Chưa có dự toán chủng loại vật tư."}
                    </p>
                  </div>
                </div>

                {/* Vật tư phát sinh / thiếu hụt nếu có */}
                {selectedDetail?.materialShortage && (
                  <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 space-y-1.5">
                    <span className="font-bold text-amber-900 text-sm flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Ghi chú vật tư phát sinh / thiếu hụt trong quá trình khảo sát:</span>
                    </span>
                    <p className="text-amber-900 text-sm whitespace-pre-wrap leading-relaxed">
                      {selectedDetail.materialShortage}
                    </p>
                  </div>
                )}

                {/* Ảnh hiện trường */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-slate-500" />
                      <span>Hình ảnh hiện trạng công trình ({surveyImages.length} ảnh):</span>
                    </span>
                    {selectedDetail?.updatedAt && (
                      <span className="text-xs text-slate-500">
                        Cập nhật: {new Date(selectedDetail.updatedAt).toLocaleString("vi-VN")}
                      </span>
                    )}
                  </div>

                  {surveyImages.length === 0 ? (
                    <p className="text-sm text-slate-400 italic py-2">
                      Chưa có hình ảnh đo đạc hiện trường được tải lên.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      {surveyImages.map((url, idx) => (
                        <div
                          key={idx}
                          onClick={() => setSelectedPreviewImage?.(url)}
                          className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-slate-200 cursor-pointer hover:border-blue-500 transition group relative shadow-2xs"
                        >
                          <img src={url} alt={`img-${idx}`} className="w-full h-full object-cover group-hover:scale-105 transition" />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                            <Maximize2 className="w-4 h-4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 1.4 Đội thợ phụ trách (nếu có) */}
              {(selectedJob.technicianName || selectedJob.preferredTechnicianName) && (
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-600">Đội thợ thi công:</span>
                    <strong className="text-slate-900 font-semibold">
                      {selectedJob.technicianName || selectedJob.preferredTechnicianName}
                    </strong>
                  </div>
                  {selectedJob.technicianPhone && (
                    <a
                      href={`tel:${selectedJob.technicianPhone}`}
                      className="text-slate-800 hover:text-blue-600 flex items-center gap-1.5 font-mono font-medium bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-sm"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{selectedJob.technicianPhone}</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TIẾN ĐỘ THI CÔNG */}
          {viewTab === "daily" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 font-medium">
                  Tổng số: <strong className="text-slate-900">{dailyReports.length}</strong> báo cáo tiến độ
                </span>
                {canDailyReport && (
                  <button
                    type="button"
                    onClick={() => handleOpenDaily?.(selectedJob)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm transition cursor-pointer"
                  >
                    + Thêm báo cáo ngày
                  </button>
                )}
              </div>

              {loadingDailyReports ? (
                <div className="py-8 text-center text-slate-400">Đang tải...</div>
              ) : dailyReports.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-400 text-sm">
                  Chưa có báo cáo tiến độ nào.
                </div>
              ) : (
                <div className="space-y-3">
                  {dailyReports.map((rep, idx) => {
                    const repImages =
                      Array.isArray(rep.imageUrls) && rep.imageUrls.length > 0
                        ? rep.imageUrls
                        : splitImageUrls
                        ? splitImageUrls(rep.progressImages)
                        : [];
                    const cost = Number(rep.materialCost) || 0;

                    return (
                      <div key={rep.id || idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-sm">
                            {rep.createdAt ? formatDate(rep.createdAt) : `Báo cáo #${idx + 1}`}
                          </span>
                          {rep.progressPercentage != null && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold rounded text-xs">
                              {rep.progressPercentage}%
                            </span>
                          )}
                        </div>

                        <p className="text-slate-800 whitespace-pre-wrap leading-relaxed text-sm">{rep.content || "Tiến độ đạt kế hoạch."}</p>

                        {cost > 0 && (
                          <div className="text-sm text-amber-800 font-medium">
                            Vật tư phát sinh: <strong className="font-mono">{formatMoney(cost)}</strong>
                          </div>
                        )}

                        {repImages.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {repImages.map((img, i) => (
                              <img
                                key={i}
                                src={img}
                                alt="progress"
                                onClick={() => setSelectedPreviewImage?.(img)}
                                className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover border border-slate-200 cursor-pointer hover:opacity-80 transition"
                              />
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

          {/* TAB 3: HỢP ĐỒNG & THÙ LAO */}
          {viewTab === "contract" && (
            <div className="space-y-4">
              {/* Thù lao giám sát */}
              <div className="p-4 sm:p-5 bg-slate-900 text-white rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block uppercase font-medium">Thù lao Giám sát viên (10%)</span>
                  <span className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400 mt-0.5 block">{formatMoney(supervisorPayout)}</span>
                </div>
                <span className="text-xs text-slate-300">Quyết toán khi hoàn tất nghiệm thu</span>
              </div>

              {/* Bảng phân bổ */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 text-sm">
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-600">Tổng giá trị hợp đồng:</span>
                  <strong className="font-mono text-slate-900 font-bold">{formatMoney(totalAmount)}</strong>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-600">Thù lao thợ thi công (60%):</span>
                  <span className="font-mono font-medium text-slate-800">{formatMoney(workerPayout)}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-600">Thù lao giám sát (10%):</span>
                  <span className="font-mono font-bold text-emerald-700">{formatMoney(supervisorPayout)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Chi phí công ty &amp; bảo hành (30%):</span>
                  <span className="font-mono text-slate-700">{formatMoney(totalAmount * 0.3)}</span>
                </div>
              </div>

              {/* Hợp đồng */}
              <div className="p-4 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-sm">
                    Hợp đồng điện tử: {contractData?.contractCode || `HD-${selectedJob.id}`}
                  </span>
                  {canAgreement && (
                    <button
                      type="button"
                      onClick={() => onOpenAgreement?.(selectedJob)}
                      className="text-blue-600 hover:underline font-bold text-sm cursor-pointer"
                    >
                      {contractData ? "Sửa thỏa thuận" : "+ Lập hợp đồng"}
                    </button>
                  )}
                </div>
                <div className="p-3.5 bg-slate-50 rounded-lg text-slate-800 text-sm max-h-48 overflow-y-auto font-mono whitespace-pre-wrap leading-relaxed">
                  {contractData?.content || "Chưa có nội dung hợp đồng thỏa thuận."}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 5. Footer: Nút hành động trực tiếp */}
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
                      onRejectJob?.(selectedJob.id);
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
                    onAcceptJob?.(selectedJob.id);
                  }}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition shadow-sm cursor-pointer"
                >
                  Tiếp nhận khảo sát
                </button>
              </>
            )}

            {canReport && (
              <button
                type="button"
                onClick={() => {
                  closeModal();
                  onOpenReport?.(selectedJob);
                }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition shadow-sm cursor-pointer"
              >
                Báo cáo khảo sát
              </button>
            )}

            {canDailyReport && (
              <button
                type="button"
                onClick={() => {
                  closeModal();
                  handleOpenDaily?.(selectedJob);
                }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition shadow-sm cursor-pointer"
              >
                + Báo cáo ngày
              </button>
            )}

            {canSupervisorAccept && (
              <button
                type="button"
                onClick={() => {
                  closeModal();
                  onSupervisorAccept?.(selectedJob.id);
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition shadow-sm cursor-pointer"
              >
                Xác nhận Nghiệm thu
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
