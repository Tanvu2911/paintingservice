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
  Award,
  Camera,
  FileSignature,
  DollarSign,
  Wrench,
} from "lucide-react";
import StatusBadge from "../../../../components/common/StatusBadge";
import { formatMoney } from "../../../../util/formatters";
import { formatDate } from "../../../../util/orderFlowUtils";

export default function SurveyJobDetailModal({
  selectedJob,
  selectedDetail,
  loadingDetail,
  viewTab,
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
  onOpenDailyReport,
  onOpenAgreement,
  onSupervisorAccept,
}) {
  if (!selectedJob) return null;

  const status = selectedJob.status || "PENDING";
  const totalAmount = Number(selectedJob.totalAmount) || 0;
  const supervisorPayout = totalAmount > 0 ? totalAmount * 0.10 : Number(selectedJob.surveyFee) || 200000;
  const workerPayout = totalAmount * 0.60;
  const depositAmount = Number(selectedJob.depositAmount) || totalAmount * 0.30;
  const remainingAmount = Number(selectedJob.remainingAmount) || Math.max(0, totalAmount - depositAmount);

  // Permissions
  const canAccept = ["PENDING", "SURVEY_ASSIGNED"].includes(status);
  const canReject = ["PENDING", "SURVEY_ASSIGNED", "ACCEPTED"].includes(status);
  const canReport = ["ACCEPTED", "SURVEYING"].includes(status);
  const canDailyReport = ["CONTRACT_APPROVED", "ASSIGNED", "PROCESSING"].includes(status);
  const canSupervisorAccept =
    status === "WORKER_COMPLETED" && (!selectedDetail || !selectedDetail.supervisorAccepted);

  const surveyImages = splitImageUrls ? splitImageUrls(selectedDetail?.surveyImages) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        
        {/* 1. Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0 border border-blue-600">
              <ShieldCheck className="w-5 h-5 text-slate-900" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-bold text-xs bg-blue-600 text-white px-2 py-0.5 rounded">
                  #{selectedJob.id}
                </span>
                <span className="text-xs font-bold text-slate-900 truncate">
                  {selectedJob.serviceName || "Khảo sát công trình"}
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
              Thù lao Giám sát (10%)
            </span>
            <span className="text-base sm:text-lg font-black text-slate-900 font-mono block mt-0.5">
              {formatMoney(supervisorPayout)}
            </span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
              Tổng giá trị công trình
            </span>
            <span className="text-sm sm:text-base font-bold text-slate-900 font-mono block mt-0.5">
              {totalAmount > 0 ? formatMoney(totalAmount) : "Chưa báo giá"}
            </span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
              Lịch hẹn khảo sát
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-900 block mt-0.5 truncate">
              {selectedJob.appointmentDate ? formatDate(selectedJob.appointmentDate) : "Chưa đặt lịch"}
            </span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
              Tiến độ hồ sơ
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-900 block mt-0.5 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <span className="truncate">
                {status === "PENDING"
                  ? "Chờ tiếp nhận"
                  : status === "SURVEYING"
                  ? "Đang khảo sát"
                  : status === "PROCESSING"
                  ? "Đang thi công"
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
            { key: "survey", label: "Khảo sát & Hiện trạng", icon: Layers },
            { key: "daily", label: `Tiến độ ngày (${dailyReports.length})`, icon: Camera },
            { key: "contract", label: "Hợp đồng & Thỏa thuận", icon: FileSignature },
            { key: "financial", label: "Tài chính & Thù lao", icon: Wallet },
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
              Đang đồng bộ hồ sơ chi tiết...
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
                        {selectedJob.customerName || "Khách hàng"}
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
                      <span className="text-slate-500">Ghi chú ban đầu:</span>
                      <span className="text-right text-slate-900 max-w-[200px] italic">
                        {selectedJob.description || "Không có yêu cầu đặc biệt"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Đội thợ thi công phụ trách */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5 text-slate-900" />
                      <span>Đội thợ thi công</span>
                    </h4>
                    <span className="text-[10px] bg-white text-slate-900 px-2 py-0.5 rounded border border-slate-200 font-semibold">
                      Triển khai thực tế
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60">
                      <span className="text-slate-500">Trưởng nhóm thợ:</span>
                      <strong className="text-slate-900">
                        {selectedJob.technicianName || selectedJob.preferredTechnicianName || "Chưa phân công thợ"}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60">
                      <span className="text-slate-500">SĐT liên hệ:</span>
                      {selectedJob.technicianPhone ? (
                        <a
                          href={`tel:${selectedJob.technicianPhone}`}
                          className="font-bold text-slate-900 hover:text-slate-900 flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 transition"
                        >
                          <Phone className="w-3 h-3 text-slate-900" />
                          <span>{selectedJob.technicianPhone}</span>
                        </a>
                      ) : (
                        <span className="text-slate-500 italic">Sẽ hiển thị khi phân thợ</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Tỷ lệ thù lao thợ:</span>
                      <span className="text-slate-900 font-bold font-mono">
                        60% ({formatMoney(workerPayout)})
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Địa chỉ công trình */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-2.5">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-900" />
                  <span>Địa điểm công trình khảo sát</span>
                </h4>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <p className="font-semibold text-sm text-slate-900 leading-relaxed">
                    {selectedJob.address || "Địa chỉ theo đơn hàng"}
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

          {/* TAB 2: KHẢO SÁT & HIỆN TRƯỜNG */}
          {viewTab === "survey" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    Kết quả đo đạc &amp; Đánh giá hiện trạng
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Thông tin ghi nhận trực tiếp tại công trình để lên dự toán vật tư và báo giá.
                  </p>
                </div>
                {canReport && (
                  <button
                    type="button"
                    onClick={() => onOpenReport?.(selectedJob)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-600 text-white font-semibold rounded-lg text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-300" />
                    <span>{selectedDetail ? "Cập nhật báo cáo KS" : "Lập báo cáo khảo sát"}</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Hiện trạng tường &amp; Yêu cầu xử lý</span>
                  <div className="p-3 bg-white rounded-lg border border-slate-200 min-h-[90px] text-xs text-slate-900 leading-relaxed">
                    {selectedDetail?.surveyNote || "Chưa có ghi chép khảo sát hiện trường."}
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Vật tư &amp; Định lượng sơn đề xuất</span>
                  <div className="p-3 bg-white rounded-lg border border-slate-200 min-h-[90px] text-xs text-slate-900 leading-relaxed">
                    {selectedDetail?.materialNote || "Chưa có dự toán vật tư."}
                  </div>
                </div>
              </div>

              {/* Ảnh khảo sát */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-2.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-slate-900" />
                  <span>Hình ảnh hiện trạng công trình ({surveyImages.length})</span>
                </span>
                {surveyImages.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2">Chưa có hình ảnh chụp hiện trường.</p>
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

          {/* TAB 3: TIẾN ĐỘ & NHẬT KÝ NGÀY */}
          {viewTab === "daily" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    Nhật ký giám sát thi công hàng ngày
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Ghi chép tiến độ và ảnh chụp hiện trường để báo cáo cho khách hàng và quản lý.
                  </p>
                </div>
                {canDailyReport && (
                  <button
                    type="button"
                    onClick={() => onOpenDailyReport?.(selectedJob)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-600 text-white font-semibold rounded-lg text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Thêm báo cáo ngày</span>
                  </button>
                )}
              </div>

              {loadingDailyReports ? (
                <div className="py-8 text-center text-slate-500 animate-pulse">Đang tải nhật ký...</div>
              ) : dailyReports.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-lg border border-slate-200 text-slate-500">
                  <Camera className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold text-xs text-slate-900">Chưa có báo cáo tiến độ nào</p>
                  <p className="text-[11px] mt-0.5">Khi công trình bắt đầu thi công, Giám sát viên bấm "Thêm báo cáo ngày" để cập nhật tiến độ.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dailyReports.map((rep, idx) => {
                    const repImages = Array.isArray(rep.imageUrls) && rep.imageUrls.length > 0
                      ? rep.imageUrls
                      : splitImageUrls ? splitImageUrls(rep.progressImages) : [];
                    const cost = Number(rep.materialCost) || Number(rep.additionalMaterialCost) || 0;
                    const shortage = rep.materialShortage || rep.materialShortageNote;

                    return (
                      <div key={rep.id || idx} className="p-4 bg-white rounded-lg border border-slate-200 space-y-2 shadow-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs">
                              Ngày {rep.createdAt ? formatDate(rep.createdAt) : `Báo cáo #${idx + 1}`}
                            </span>
                            {rep.progressPercentage != null && (
                              <span className="px-2 py-0.5 bg-[#E2E8F0] text-slate-900 font-bold rounded text-[10px] border border-slate-200">
                                Tiến độ: {rep.progressPercentage}%
                              </span>
                            )}
                          </div>
                          {(rep.author || rep.reporterName) && (
                            <span className="text-[10px] text-slate-500">Ghi nhận bởi: {rep.author || rep.reporterName}</span>
                          )}
                        </div>

                        <p className="text-xs text-slate-900 leading-relaxed">
                          {rep.content || rep.workDescription || "Tiến độ đạt yêu cầu theo kế hoạch."}
                        </p>

                        {cost > 0 && (
                          <div className="text-[11px] text-slate-900 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                            Vật tư phát sinh: <strong>{formatMoney(cost)}</strong>
                            {shortage && ` (${shortage})`}
                          </div>
                        )}

                        {repImages.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {repImages.map((imgUrl, imgIdx) => (
                              <div
                                key={imgIdx}
                                onClick={() => setSelectedPreviewImage?.(imgUrl)}
                                className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 cursor-pointer hover:opacity-80 transition"
                              >
                                <img src={imgUrl} alt={`report-img-${imgIdx}`} className="w-full h-full object-cover" />
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

          {/* TAB 4: HỢP ĐỒNG & THỎA THUẬN */}
          {viewTab === "contract" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    Thỏa thuận thi công &amp; Hợp đồng điện tử
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Hợp đồng xác nhận giữa Khách hàng, Giám sát viên và Công ty.
                  </p>
                </div>
                {["ACCEPTED", "SURVEYING"].includes(status) && (
                  <button
                    type="button"
                    onClick={() => onOpenAgreement?.(selectedJob)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-600 text-white font-semibold rounded-lg text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <FileSignature className="w-3.5 h-3.5" />
                    <span>Lập thỏa thuận &amp; Ký hợp đồng</span>
                  </button>
                )}
              </div>

              {contractData ? (
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="font-bold text-xs text-slate-900">Mã hợp đồng: {contractData.contractCode || `HD-${selectedJob.id}`}</span>
                    <span className="px-2 py-0.5 bg-slate-50 text-slate-900 border border-slate-200 rounded text-[10px] font-bold">
                      {contractData.status || "ĐÃ LẬP"}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs text-slate-900 whitespace-pre-wrap leading-relaxed">
                    {contractData.content || "Nội dung hợp đồng thỏa thuận thi công..."}
                  </div>
                  {contractData.adminSignatureImg && (
                    <div className="pt-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Chữ ký Đại diện Công ty (Admin):</span>
                      <img src={contractData.adminSignatureImg} alt="Signature" className="h-14 bg-white border border-slate-200 rounded p-1" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-lg border border-slate-200 text-slate-500">
                  <FileSignature className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold text-xs text-slate-900">Chưa có hợp đồng chính thức</p>
                  <p className="text-[11px] mt-0.5">Sau khi hoàn tất khảo sát, Giám sát viên và Khách hàng sẽ tiến hành ký thỏa thuận hợp đồng.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: TÀI CHÍNH & THÙ LAO */}
          {viewTab === "financial" && (
            <div className="space-y-4">
              <div className="bg-[#E2E8F0] p-4 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-900 tracking-wider">
                    Thù lao Giám sát viên nhận (10%)
                  </span>
                  <div className="text-2xl font-black text-slate-900 font-mono mt-0.5">
                    {formatMoney(supervisorPayout)}
                  </div>
                  <p className="text-[11px] text-slate-900/80 mt-0.5">
                    Tương đương <strong>10%</strong> tổng giá trị hợp đồng ({formatMoney(totalAmount)})
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-white text-slate-900 font-bold text-xs rounded border border-slate-200">
                    Tự động quyết toán khi hoàn thành nghiệm thu
                  </span>
                </div>
              </div>

              {/* Bảng phân bổ hợp đồng */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-2.5">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Bảng phân bổ tài chính công trình
                </h4>
                <div className="divide-y divide-[#E2E8F0] text-xs">
                  <div className="py-2 flex justify-between items-center">
                    <span className="text-slate-500">Tổng giá trị hợp đồng:</span>
                    <strong className="text-slate-900 font-mono text-sm">{formatMoney(totalAmount)}</strong>
                  </div>
                  <div className="py-2 flex justify-between items-center">
                    <span className="text-slate-500">Tiền cọc khách đã trả (30%):</span>
                    <span className="font-bold text-slate-900 font-mono">{formatMoney(depositAmount)}</span>
                  </div>
                  <div className="py-2 flex justify-between items-center">
                    <span className="text-slate-500">Tiền khách thanh toán khi nghiệm thu (70%):</span>
                    <span className="font-bold text-slate-900 font-mono">{formatMoney(remainingAmount)}</span>
                  </div>
                  <div className="py-2 flex justify-between items-center">
                    <span className="text-slate-500">Thù lao Giám sát viên (10%):</span>
                    <span className="font-bold text-slate-900 font-mono">{formatMoney(supervisorPayout)}</span>
                  </div>
                  <div className="py-2 flex justify-between items-center">
                    <span className="text-slate-500">Thù lao Đội thợ thi công (60%):</span>
                    <span className="font-bold text-slate-900 font-mono">{formatMoney(workerPayout)}</span>
                  </div>
                  <div className="py-2 flex justify-between items-center">
                    <span className="text-slate-500">Vận hành công ty &amp; Sơn bảo hành (30%):</span>
                    <span className="font-bold text-slate-900 font-mono">{formatMoney(totalAmount * 0.30)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 5. Modal Footer Action Bar */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500">Trạng thái đơn:</span>
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
                      onRejectJob?.(selectedJob.id);
                    }}
                    className="px-4 py-2 rounded-lg bg-slate-50 hover:bg-slate-50 text-slate-900 font-semibold border border-slate-200 transition text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Từ chối</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    closeModal();
                    onAcceptJob?.(selectedJob.id);
                  }}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs transition text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Nhận việc khảo sát</span>
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
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs transition text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-slate-300" />
                <span>Báo cáo khảo sát</span>
              </button>
            )}

            {canDailyReport && (
              <button
                type="button"
                onClick={() => {
                  closeModal();
                  onOpenDailyReport?.(selectedJob);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs transition text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Nhật ký ngày</span>
              </button>
            )}

            {canSupervisorAccept && (
              <button
                type="button"
                onClick={() => {
                  closeModal();
                  onSupervisorAccept?.(selectedJob.id);
                }}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs transition text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Xác nhận Nghiệm thu</span>
              </button>
            )}

            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-900 font-semibold rounded-lg border border-slate-200 text-xs transition cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
