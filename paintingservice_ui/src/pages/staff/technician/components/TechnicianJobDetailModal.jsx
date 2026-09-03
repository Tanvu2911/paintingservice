import React from "react";
import {
  X,
  User,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Wallet,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Hammer,
  Sparkles,
  Layers,
  Check,
  Play,
  XCircle,
  ExternalLink,
  Camera,
  Wrench,
} from "lucide-react";
import StatusBadge from "../../../../components/common/StatusBadge";
import { formatMoney } from "../../../../util/formatters";
import { formatDate } from "../../../../util/orderFlowUtils";

export default function TechnicianJobDetailModal({
  selectedJob,
  selectedDetail,
  loadingDetail,
  viewTab,
  setViewTab,
  splitImageUrls,
  setSelectedPreviewImage,
  closeModal,
  onAccept,
  onReject,
  onStart,
  onComplete,
}) {
  if (!selectedJob) return null;

  const status = selectedJob.status || "";
  const totalAmount = Number(selectedJob.totalAmount) || 0;
  const workerPayout = totalAmount > 0 ? totalAmount * 0.60 : 0;
  const supervisorPayout = totalAmount * 0.10;
  const depositAmount = Number(selectedJob.depositAmount) || totalAmount * 0.30;
  const remainingAmount = Number(selectedJob.remainingAmount) || Math.max(0, totalAmount - depositAmount);

  // Worker Actions Permissions
  const canAccept = ["CONTRACT_APPROVED", "DEPOSIT_CONFIRMED", "ASSIGNED"].includes(status);
  const canReject = ["CONTRACT_APPROVED", "DEPOSIT_CONFIRMED", "ASSIGNED", "ACCEPTED"].includes(status);
  const canStart = status === "ACCEPTED";
  const canComplete = status === "PROCESSING";
  const isWaitingAcceptance = status === "WORKER_COMPLETED";
  const isDone = ["WAITING_FINAL_PAYMENT", "COMPLETED", "PAID_TO_STAFF"].includes(status);

  const supervisorName = selectedJob.surveyorName || selectedJob.supervisorName;
  const surveyImages = splitImageUrls ? splitImageUrls(selectedDetail?.surveyImages) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        
        {/* 1. Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0 border border-blue-600">
              <Wrench className="w-5 h-5 text-slate-900" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-bold text-xs bg-blue-600 text-white px-2 py-0.5 rounded">
                  #{selectedJob.id}
                </span>
                <span className="text-xs font-bold text-slate-900 truncate">
                  {selectedJob.serviceName || selectedJob.service?.name || "Công trình thi công"}
                </span>
                <StatusBadge status={status} />
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                {selectedJob.address || "Địa chỉ công trình"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeModal}
            className="w-8 h-8 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition cursor-pointer shrink-0"
            title="Đóng cửa sổ"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. Top Highlight Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 sm:px-6 bg-white border-b border-slate-200">
          <div className="p-3 bg-[#E2E8F0] border border-slate-200 rounded-lg">
            <span className="text-[10px] font-bold text-slate-900 uppercase tracking-wider block">
              Thù lao Thợ nhận (60%)
            </span>
            <span className="text-base sm:text-lg font-black text-slate-900 font-mono block mt-0.5">
              {workerPayout > 0 ? formatMoney(workerPayout) : "Chưa có dự toán"}
            </span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
              Tổng giá trị công trình
            </span>
            <span className="text-sm sm:text-base font-bold text-slate-900 font-mono block mt-0.5">
              {totalAmount > 0 ? formatMoney(totalAmount) : "Theo khảo sát"}
            </span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
              Ngày thi công
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-900 block mt-0.5 truncate">
              {formatDate(selectedJob.expectedStartDate || selectedJob.appointmentDate)}
            </span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
              Tiến độ thi công
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-900 block mt-0.5 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <span className="truncate">
                {status === "ASSIGNED" || status === "CONTRACT_APPROVED"
                  ? "Chờ thợ nhận việc"
                  : status === "ACCEPTED"
                  ? "Sẵn sàng bắt đầu"
                  : status === "PROCESSING"
                  ? "Đang triển khai sơn"
                  : status === "WORKER_COMPLETED"
                  ? "Chờ nghiệm thu"
                  : status === "COMPLETED"
                  ? "Hoàn tất 100%"
                  : status}
              </span>
            </span>
          </div>
        </div>

        {/* 3. Navigation Tabs */}
        <div className="flex border-b border-slate-200 px-4 sm:px-6 bg-white gap-2 sm:gap-4 overflow-x-auto">
          {[
            { key: "overview", label: "Tổng quan & Khách hàng", icon: User },
            { key: "technical", label: "Yêu cầu kỹ thuật & Vật tư", icon: Layers },
            { key: "financial", label: "Tài chính & Thù lao thợ", icon: Wallet },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = viewTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setViewTab(tab.key)}
                className={`py-3 px-2 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
                  active
                    ? "border-blue-600 text-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? "text-slate-900" : "text-slate-500"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 4. Tab Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 text-xs space-y-4">
          {loadingDetail && (
            <div className="p-2.5 bg-slate-50 text-slate-900 rounded-lg animate-pulse font-medium text-center">
              Đang tải chi tiết yêu cầu công trình...
            </div>
          )}

          {/* TAB 1: TỔNG QUAN & KHÁCH HÀNG */}
          {viewTab === "overview" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Thông tin Khách hàng */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-900" />
                      <span>Thông tin chủ nhà</span>
                    </h4>
                    <span className="text-[10px] bg-white text-slate-900 px-2 py-0.5 rounded border border-slate-200 font-semibold">
                      Khách hàng
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60">
                      <span className="text-slate-500">Họ và tên:</span>
                      <strong className="text-slate-900">
                        {selectedJob.customerName || selectedJob.customer?.username || "Khách hàng"}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60">
                      <span className="text-slate-500">Số điện thoại:</span>
                      {selectedJob.customerPhone ? (
                        <a
                          href={`tel:${selectedJob.customerPhone}`}
                          className="font-bold text-slate-900 hover:text-slate-900 flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 transition"
                        >
                          <Phone className="w-3 h-3 text-slate-900" />
                          <span>{selectedJob.customerPhone}</span>
                        </a>
                      ) : (
                        <span className="text-slate-500 italic">Chưa cập nhật</span>
                      )}
                    </div>

                    <div className="flex items-start justify-between">
                      <span className="text-slate-500">Ghi chú công việc:</span>
                      <span className="text-right text-slate-900 max-w-[200px] italic">
                        {selectedJob.description || "Thực hiện theo tiêu chuẩn kỹ thuật"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Giám sát viên phụ trách */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-900" />
                      <span>Giám sát viên phụ trách</span>
                    </h4>
                    <span className="text-[10px] bg-white text-slate-900 px-2 py-0.5 rounded border border-slate-200 font-semibold">
                      Kiểm tra &amp; Nghiệm thu
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60">
                      <span className="text-slate-500">Người giám sát:</span>
                      <strong className="text-slate-900">
                        {supervisorName || "Giám sát viên hệ thống"}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60">
                      <span className="text-slate-500">SĐT Giám sát:</span>
                      {selectedJob.surveyorPhone || selectedJob.supervisorPhone ? (
                        <a
                          href={`tel:${selectedJob.surveyorPhone || selectedJob.supervisorPhone}`}
                          className="font-bold text-slate-900 hover:text-slate-900 flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 transition"
                        >
                          <Phone className="w-3 h-3 text-slate-900" />
                          <span>{selectedJob.surveyorPhone || selectedJob.supervisorPhone}</span>
                        </a>
                      ) : (
                        <span className="text-slate-500 italic">Liên hệ qua hotline công ty</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Nhiệm vụ:</span>
                      <span className="text-slate-900 font-medium">Khảo sát, cấp vật tư &amp; Nghiệm thu</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Địa chỉ công trình */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-2.5">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-900" />
                  <span>Địa điểm thi công thực tế</span>
                </h4>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <p className="font-semibold text-sm text-slate-900 leading-relaxed">
                    {selectedJob.address || "Địa chỉ theo công trình"}
                  </p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedJob.address || "Hà Nội")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-900 font-semibold rounded-lg border border-slate-200 transition shrink-0 flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-900" />
                    <span>Mở Google Maps</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: YÊU CẦU KỸ THUẬT & VẬT TƯ */}
          {viewTab === "technical" && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Hướng Dẫn Kỹ Thuật &amp; Dự Toán Vật Tư (Từ Giám Sát)
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Đội thợ tuân thủ nghiêm ngặt các ghi chú xử lý bề mặt tường và sử dụng đúng định lượng vật tư chỉ định.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Hiện trạng bề mặt &amp; Yêu cầu thi công</span>
                  <div className="p-3 bg-white rounded-lg border border-slate-200 min-h-[90px] text-xs text-slate-900 leading-relaxed">
                    {selectedDetail?.surveyNote || "Thi công chuẩn theo quy trình sơn 1 lót 2 phủ."}
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Chủng loại sơn &amp; Vật tư cấp</span>
                  <div className="p-3 bg-white rounded-lg border border-slate-200 min-h-[90px] text-xs text-slate-900 leading-relaxed">
                    {selectedDetail?.materialNote || "Sử dụng sơn và dụng cụ theo định mức công ty cấp."}
                  </div>
                </div>
              </div>

              {/* Ảnh khảo sát hiện trường trước khi làm */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-2.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-slate-900" />
                  <span>Ảnh chụp hiện trường trước khi làm ({surveyImages.length})</span>
                </span>
                {surveyImages.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2">Chưa có ảnh khảo sát hiện trường đính kèm.</p>
                ) : (
                  <div className="flex flex-wrap gap-2.5 pt-1">
                    {surveyImages.map((url, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedPreviewImage?.(url)}
                        className="w-20 h-20 rounded-lg overflow-hidden border border-slate-200 cursor-pointer hover:opacity-80 transition shadow-xs"
                      >
                        <img src={url} alt={`survey-${idx}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: TÀI CHÍNH & THÙ LAO THỢ */}
          {viewTab === "financial" && (
            <div className="space-y-4">
              <div className="bg-[#E2E8F0] p-4 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-900 tracking-wider">
                    Thù lao Đội thợ nhận (60%)
                  </span>
                  <div className="text-2xl font-black text-slate-900 font-mono mt-0.5">
                    {formatMoney(workerPayout)}
                  </div>
                  <p className="text-[11px] text-slate-900/80 mt-0.5">
                    Tương đương <strong>60%</strong> tổng giá trị công trình ({formatMoney(totalAmount)})
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-white text-slate-900 font-bold text-xs rounded border border-slate-200">
                    Quyết toán sau khi Giám sát &amp; Khách nghiệm thu 100%
                  </span>
                </div>
              </div>

              {/* Bảng phân bổ hợp đồng */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-2.5">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Chi tiết tài chính công trình
                </h4>
                <div className="divide-y divide-[#E2E8F0] text-xs">
                  <div className="py-2 flex justify-between items-center">
                    <span className="text-slate-500">Tổng giá trị công trình:</span>
                    <strong className="text-slate-900 font-mono text-sm">{formatMoney(totalAmount)}</strong>
                  </div>
                  <div className="py-2 flex justify-between items-center">
                    <span className="text-slate-500">Thù lao Đội thợ thi công (60%):</span>
                    <span className="font-bold text-slate-900 font-mono">{formatMoney(workerPayout)}</span>
                  </div>
                  <div className="py-2 flex justify-between items-center">
                    <span className="text-slate-500">Thù lao Giám sát viên (10%):</span>
                    <span className="font-bold text-slate-500 font-mono">{formatMoney(supervisorPayout)}</span>
                  </div>
                  <div className="py-2 flex justify-between items-center">
                    <span className="text-slate-500">Khách hàng đã đặt cọc (30%):</span>
                    <span className="font-bold text-slate-900 font-mono">{formatMoney(depositAmount)}</span>
                  </div>
                  <div className="py-2 flex justify-between items-center">
                    <span className="text-slate-500">Khách hàng thanh toán đợt cuối (70%):</span>
                    <span className="font-bold text-slate-900 font-mono">{formatMoney(remainingAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 5. Modal Footer Action Bar */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500">Trạng thái:</span>
            <StatusBadge status={status} />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {canAccept && (
              <>
                {canReject && (
                  <button
                    type="button"
                    onClick={() => {
                      closeModal();
                      onReject?.(selectedJob.id);
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200 transition text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Từ chối</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    closeModal();
                    onAccept?.(selectedJob.id);
                  }}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Nhận việc</span>
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
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current text-white" />
                <span>Bắt đầu thi công ngay</span>
              </button>
            )}

            {canComplete && (
              <button
                type="button"
                onClick={() => {
                  closeModal();
                  onComplete?.(selectedJob.id);
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Báo Hoàn Thành Thi Công</span>
              </button>
            )}

            {isWaitingAcceptance && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 bg-teal-50 px-3 py-2 rounded-xl border border-teal-200">
                <Clock className="w-3.5 h-3.5 text-teal-600" />
                <span>Đã báo hoàn thành — Đang chờ nghiệm thu &amp; tất toán</span>
              </span>
            )}

            {isDone && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-900 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                <Sparkles className="w-3.5 h-3.5 text-slate-500" />
                <span>Công trình hoàn tất 100%</span>
              </span>
            )}

            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-900 font-bold rounded-xl border border-slate-200 text-xs transition cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
