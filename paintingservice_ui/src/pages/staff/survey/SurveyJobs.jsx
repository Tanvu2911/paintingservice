import { useState, useEffect, useCallback, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import AxiosConfig from "../../../util/AxiosConfig";
import { bookingDetailApi } from "../../../util/bookingDetailApi";
import { formatMoney, splitImageUrls } from "../../../util/formatters";

// Shared Reusable Components
import Modal from "../../../components/common/Modal";
import LoadingState from "../../../components/common/LoadingState";
import EmptyState from "../../../components/common/EmptyState";
import BookingFilters from "../../../components/booking/BookingFilters";
import BookingCard from "../../../components/booking/BookingCard";
import SurveyReportForm from "../../../components/report/SurveyReportForm";
import DailyReportForm from "../../../components/report/DailyReportForm";
import ContractForm from "../../../components/contract/ContractForm";

export default function SurveyJobs() {
  const { showToast } = useOutletContext();

  // =========================================================
  // STATE
  // =========================================================

  const [jobs, setJobs] = useState([]);
  const [detailsMap, setDetailsMap] = useState({});
  const [loading, setLoading] = useState(true);

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortOrder, setSortOrder] = useState("newest");

  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [dailyReports, setDailyReports] = useState([]);
  const [loadingDailyReports, setLoadingDailyReports] = useState(false);

  // =========================================================
  // LOAD JOBS & BOOKING DETAILS
  // =========================================================

  const loadJobs = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading) setLoading(true);

        // [BOOKING API] Fetch survey jobs
        const res = await AxiosConfig.get("/staff/survey/jobs");
        const jobList = Array.isArray(res.data) ? res.data : [];
        setJobs(jobList);

        // [BOOKINGDETAIL API] Fetch associated detail for each booking
        const detailPromises = jobList.map(async (j) => {
          try {
            const details = await bookingDetailApi.list(j.id);
            return { bookingId: j.id, detail: details[0] || null };
          } catch (err) {
            console.warn(`Lỗi load detail cho booking #${j.id}:`, err);
            return { bookingId: j.id, detail: null };
          }
        });

        const detailResults = await Promise.all(detailPromises);
        const map = {};
        detailResults.forEach(({ bookingId, detail }) => {
          map[bookingId] = detail;
        });
        setDetailsMap(map);
      } catch (err) {
        console.error("Lỗi load jobs:", err);
        showToast?.(
          err.response?.data?.message ||
            "Không thể lấy danh sách công việc khảo sát",
          "error"
        );
        setJobs([]);
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    loadJobs(true);
  }, [loadJobs]);

  // =========================================================
  // FILTERING & SORTING
  // =========================================================

  const filteredJobs = useMemo(() => {
    let result = [...jobs];

    if (statusFilter === "PENDING") {
      result = result.filter((j) =>
        ["PENDING", "SURVEY_ASSIGNED"].includes(j.status)
      );
    }
    if (statusFilter === "IN_PROGRESS") {
      result = result.filter((j) =>
        [
          "ACCEPTED",
          "SURVEYING",
          "WAITING_CONTRACT_APPROVAL",
          "CONTRACT_APPROVED",
          "PROCESSING",
        ].includes(j.status)
      );
    }
    if (statusFilter === "COMPLETED") {
      result = result.filter((j) =>
        ["WORKER_COMPLETED", "COMPLETED", "CANCELLED"].includes(j.status)
      );
    }

    if (searchText.trim()) {
      const q = searchText.toLowerCase().trim();
      result = result.filter(
        (j) =>
          (j.address || "").toLowerCase().includes(q) ||
          (j.serviceName || "").toLowerCase().includes(q) ||
          (j.customerName || "").toLowerCase().includes(q) ||
          String(j.id).includes(q)
      );
    }

    result.sort((a, b) => {
      const dateA = new Date(a.appointmentDate || a.bookingDate || 0).getTime();
      const dateB = new Date(b.appointmentDate || b.bookingDate || 0).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [jobs, searchText, statusFilter, sortOrder]);

  // =========================================================
  // API ACTIONS (ACCEPT / REJECT JOB)
  // =========================================================

  const handleAcceptJob = async (jobId) => {
    try {
      await AxiosConfig.put(`/staff/survey/jobs/${jobId}/accept`);
      showToast?.("Đã xác nhận nhận việc khảo sát!", "success");
      loadJobs(false);
    } catch (err) {
      showToast?.(err.response?.data?.message || "Lỗi khi nhận việc", "error");
    }
  };

  const handleRejectJob = async (jobId) => {
    const reason = window.prompt("Nhập lý do từ chối nhận việc khảo sát:");
    if (reason === null) return;
    if (!reason.trim()) {
      showToast?.("Vui lòng nhập lý do từ chối", "error");
      return;
    }

    try {
      await AxiosConfig.post(`/bookings/${jobId}/reject-survey`, {
        reason: reason.trim(),
      });
      showToast?.("Đã từ chối nhận việc khảo sát!", "success");
      loadJobs(false);
    } catch (err) {
      showToast?.(
        err.response?.data?.message || "Lỗi khi từ chối nhận việc",
        "error"
      );
    }
  };

  // =========================================================
  // MODAL OPEN / CLOSE & LOAD DETAIL
  // =========================================================

  const openModal = async (job, type) => {
    setSelectedJob(job);
    setModalType(type);
    setDailyReports([]);

    setLoadingDetail(true);
    let detail = detailsMap[job.id] || null;
    try {
      const details = await bookingDetailApi.list(job.id);
      detail = Array.isArray(details) && details.length > 0 ? details[0] : null;
    } catch (err) {
      console.warn(`Lỗi khi tải detail cho booking #${job.id}:`, err);
      detail = null;
    }
    setSelectedDetail(detail);
    setLoadingDetail(false);

    if (type === "view") {
      try {
        setLoadingDailyReports(true);
        const res = await AxiosConfig.get(`/daily-reports/booking/${job.id}`);
        setDailyReports(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Lỗi lấy báo cáo ngày:", err);
      } finally {
        setLoadingDailyReports(false);
      }
    }
  };

  const closeModal = () => {
    setSelectedJob(null);
    setSelectedDetail(null);
    setModalType(null);
    setDailyReports([]);
  };

  // =========================================================
  // SUBMIT HANDLERS
  // =========================================================

  const handleSubmitSurveyReport = async (formData) => {
    if (!selectedJob) return;

    try {
      setSubmitting(true);

      // 1. [BOOKING API] Save quote amounts on Booking
      await AxiosConfig.post(`/staff/survey/jobs/${selectedJob.id}/report`, {
        totalAmount: formData.totalAmount,
        depositAmount: formData.depositAmount,
      });

      // 2. [BOOKINGDETAIL API] Ensure BookingDetail exists
      let detail = selectedDetail;
      if (!detail) {
        try {
          const detailsList = await bookingDetailApi.list(selectedJob.id);
          detail = Array.isArray(detailsList) && detailsList.length > 0 ? detailsList[0] : null;
        } catch {
          detail = null;
        }
        if (!detail) {
          detail = await bookingDetailApi.create(selectedJob.id);
        }
      }

      // 3. [BOOKINGDETAIL API] Save survey notes & uploaded images
      await bookingDetailApi.updateSurvey(detail.id, {
        surveyNote: formData.surveyNote || null,
        materialNote: formData.materialNote || null,
        files: formData.surveyImages,
      });

      // 4. [BOOKINGDETAIL API] Save material shortage if provided
      if (formData.materialShortage) {
        await bookingDetailApi.reportShortage(
          detail.id,
          formData.materialShortage
        );
      }

      showToast?.("Đã gửi báo cáo khảo sát & báo giá thành công!", "success");
      closeModal();
      loadJobs(false);
    } catch (err) {
      console.error("Lỗi khi gửi báo cáo khảo sát:", err);
      showToast?.(
        err.response?.data?.message || "Lỗi khi gửi báo cáo khảo sát",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitDailyReport = async (formData) => {
    if (!selectedJob) return;

    try {
      setSubmitting(true);

      await AxiosConfig.post(`/daily-reports/${selectedJob.id}`, {
        content: formData.content,
        progressPercentage: formData.progressPercentage,
        materialShortage: formData.materialShortage,
        progressImages: null,
      });

      if (formData.progressImages?.length > 0) {
        const payload = new FormData();
        formData.progressImages.forEach((file) => payload.append("files", file));
        payload.append("note", formData.content);
        await AxiosConfig.post(
          `/daily-reports/${selectedJob.id}/progress-images`,
          payload,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
      }

      showToast?.("Đã gửi báo cáo ngày thành công!", "success");
      closeModal();
      loadJobs(false);
    } catch (err) {
      console.error("Lỗi gửi báo cáo ngày:", err);
      showToast?.(
        err.response?.data?.message || "Lỗi khi gửi báo cáo ngày",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitAgreement = async (formData) => {
    if (!selectedJob) return;

    if (formData.customerAgreed && (!formData.hasSignature || !formData.signatureDataUrl)) {
      showToast?.("Vui lòng ký tên trước khi gửi hợp đồng", "error");
      return;
    }

    try {
      setSubmitting(true);

      if (formData.customerAgreed) {
        const contractPayload = {
          bookingId: Number(selectedJob.id),
          contractCode: `HD-${selectedJob.id}-${Date.now()}`,
          content: formData.contractContent,
          customerSigned: false,
          surveySigned: true,
          surveySignatureImg: formData.signatureDataUrl,
        };

        await AxiosConfig.post("/contracts", contractPayload);
        showToast?.(
          "Đã lập hợp đồng (có chữ ký giám sát) & gửi Admin duyệt!",
          "success"
        );
      } else {
        await AxiosConfig.put(`/bookings/${selectedJob.id}`, {
          ...selectedJob,
          status: "CANCELLED",
          description:
            (selectedJob.description || "") +
            `\n[Lý do hủy sau khảo sát]: ${formData.rejectReason}`,
        });
        showToast?.("Đã báo cáo khách không đồng ý. Đơn đã được hủy.", "success");
      }

      closeModal();
      loadJobs(false);
    } catch (err) {
      console.error(err);
      showToast?.(
        err.response?.data?.message || "Lỗi khi gửi hợp đồng / hủy đơn",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSupervisorAccept = async (jobId) => {
    if (
      !window.confirm(
        "Xác nhận nghiệm thu công trình này?\n\n" +
          "(Cần cả khách hàng xác nhận thì đơn mới chuyển sang Hoàn thành)"
      )
    ) {
      return;
    }

    try {
      let detail = detailsMap[jobId] || null;
      if (!detail) {
        try {
          const detailsList = await bookingDetailApi.list(jobId);
          detail = Array.isArray(detailsList) && detailsList.length > 0 ? detailsList[0] : null;
        } catch {
          detail = null;
        }
      }
      if (!detail) {
        detail = await bookingDetailApi.create(jobId);
      }

      await bookingDetailApi.supervisorAccept(detail.id);
      showToast?.("Đã xác nhận nghiệm thu (Giám sát).", "success");
      loadJobs(false);
    } catch (err) {
      showToast?.(
        err.response?.data?.message || "Không thể xác nhận nghiệm thu",
        "error"
      );
    }
  };

  // Initial contract content template helper
  const getInitialContractContent = (job, detail) => {
    const preferredName =
      job.preferredTechnicianName ||
      job.preferredTechnician?.username ||
      "đội thợ do khách chỉ định / hệ thống phân công";

    const priceBlock =
      job.totalAmount != null
        ? `\nTổng báo giá: ${formatMoney(job.totalAmount)}\n` +
          `Tiền cọc: ${formatMoney(job.depositAmount)}\n` +
          `Còn lại: ${formatMoney(job.remainingAmount)}\n`
        : "\n";

    return (
      `HỢP ĐỒNG SỬA CHỮA / CẢI TẠO\n\n` +
      `Mã đơn: #${job.id}\n` +
      `Khách hàng: ${job.customerName || "..."}\n` +
      `Địa chỉ công trình: ${job.address || "..."}\n` +
      `Dịch vụ: ${job.serviceName || "..."}\n` +
      priceBlock +
      `\nNội dung công việc (theo khảo sát):\n` +
      `${detail?.surveyNote || "..."}\n\n` +
      `Vật tư dự kiến:\n` +
      `${detail?.materialNote || "..."}\n\n` +
      `Đội thi công: ${preferredName}\n\n` +
      `Các bên cam kết thực hiện đúng nội dung đã thỏa thuận.`
    );
  };

  // =========================================================
  // RENDER
  // =========================================================

  if (loading) return <LoadingState message="Đang tải danh sách công việc..." />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-bold text-slate-800">
          Danh Sách Lịch Khảo Sát
        </h2>
        <button
          onClick={() => loadJobs(true)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Làm mới
        </button>
      </div>

      <BookingFilters
        searchText={searchText}
        onSearchChange={setSearchText}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        sortOrder={sortOrder}
        onSortChange={setSortOrder}
        totalCount={jobs.length}
        filteredCount={filteredJobs.length}
      />

      {filteredJobs.length === 0 ? (
        <EmptyState
          message={
            jobs.length === 0
              ? "Chưa có công việc khảo sát nào được phân công."
              : "Không tìm thấy đơn phù hợp với bộ lọc."
          }
        />
      ) : (
        <div className="grid gap-4">
          {filteredJobs.map((job) => {
            const detail = detailsMap[job.id] || null;
            const status = job.status || "PENDING";
            const canAccept = ["PENDING", "SURVEY_ASSIGNED"].includes(status);
            const canReport = [
              "SURVEY_ASSIGNED",
              "ACCEPTED",
              "SURVEYING",
            ].includes(status);
            const hasSurveyReport = Boolean(
              detail?.surveyNote || detail?.materialNote || detail?.materialShortage
            );
            const canSubmitAgreement =
              hasSurveyReport && ["ACCEPTED", "SURVEYING"].includes(status);
            const canDailyReport = [
              "CONTRACT_APPROVED",
              "PROCESSING",
            ].includes(status);
            const canSupervisorAccept =
              status === "WORKER_COMPLETED" && (!detail || !detail.supervisorAccepted);

            return (
              <BookingCard
                key={job.id}
                job={job}
                detail={detail}
                actions={
                  <>
                    {canAccept && (
                      <>
                        <button
                          onClick={() => handleAcceptJob(job.id)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition"
                        >
                          Xác nhận nhận việc
                        </button>
                        <button
                          onClick={() => handleRejectJob(job.id)}
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold transition"
                        >
                          Từ chối nhận việc
                        </button>
                      </>
                    )}
                    {canReport && (
                      <button
                        onClick={() => openModal(job, "report")}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition"
                      >
                        Gửi báo cáo khảo sát
                      </button>
                    )}
                    {canSubmitAgreement && (
                      <button
                        onClick={() => openModal(job, "agreement")}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition"
                      >
                        Báo cáo kết quả & Lập hợp đồng
                      </button>
                    )}
                    {canDailyReport && (
                      <button
                        onClick={() => openModal(job, "daily")}
                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition"
                      >
                        Gửi báo cáo ngày
                      </button>
                    )}
                    {canSupervisorAccept && (
                      <button
                        onClick={() => handleSupervisorAccept(job.id)}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition"
                      >
                        Nghiệm thu (Giám sát)
                      </button>
                    )}
                    {hasSurveyReport && (
                      <button
                        onClick={() => openModal(job, "view")}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition"
                      >
                        Xem báo cáo
                      </button>
                    )}
                  </>
                }
              />
            );
          })}
        </div>
      )}

      {/* Shared Modal Wrapper */}
      {selectedJob && modalType && (
        <Modal
          isOpen={Boolean(selectedJob && modalType)}
          onClose={closeModal}
          title={
            modalType === "report"
              ? `Báo cáo khảo sát #${selectedJob.id}`
              : modalType === "daily"
              ? `Báo cáo hàng ngày #${selectedJob.id}`
              : modalType === "view"
              ? `Lịch sử báo cáo #${selectedJob.id}`
              : `Kết quả thỏa thuận & Hợp đồng #${selectedJob.id}`
          }
          size="lg"
        >
          {loadingDetail && (
            <div className="p-3 bg-blue-50 text-blue-700 text-xs rounded-xl animate-pulse">
              Đang tải thông tin BookingDetail...
            </div>
          )}

          {modalType === "report" && (
            <SurveyReportForm
              initialData={{
                surveyNote: selectedDetail?.surveyNote,
                materialNote: selectedDetail?.materialNote,
                materialShortage: selectedDetail?.materialShortage,
                totalAmount: selectedJob.totalAmount,
                depositAmount: selectedJob.depositAmount,
              }}
              onSubmit={handleSubmitSurveyReport}
              submitting={submitting}
            />
          )}

          {modalType === "daily" && (
            <DailyReportForm
              onSubmit={handleSubmitDailyReport}
              submitting={submitting}
            />
          )}

          {modalType === "agreement" && (
            <ContractForm
              initialContent={getInitialContractContent(selectedJob, selectedDetail)}
              onSubmit={handleSubmitAgreement}
              submitting={submitting}
            />
          )}

          {modalType === "view" && (
            <div className="space-y-5">
              <div className="border border-indigo-200 rounded-2xl overflow-hidden">
                <div className="bg-indigo-50 px-4 py-3">
                  <h4 className="font-bold text-indigo-800">
                    🔎 BÁO CÁO KHẢO SÁT (BookingDetail)
                  </h4>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Nội dung khảo sát
                    </label>
                    <div className="bg-slate-50 border rounded-xl p-3 text-sm whitespace-pre-wrap min-h-[60px]">
                      {selectedDetail?.surveyNote || "Chưa có ghi chú khảo sát"}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Vật liệu dự kiến
                    </label>
                    <div className="bg-slate-50 border rounded-xl p-3 text-sm whitespace-pre-wrap">
                      {selectedDetail?.materialNote || "Chưa có thông tin"}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Thiếu vật liệu / phát sinh
                    </label>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm whitespace-pre-wrap">
                      {selectedDetail?.materialShortage || "Không có phát sinh"}
                    </div>
                  </div>
                  {splitImageUrls(selectedDetail?.surveyImages).length > 0 && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        📷 Ảnh khảo sát
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {splitImageUrls(selectedDetail?.surveyImages).map(
                          (url, idx) => (
                            <a
                              key={idx}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block aspect-square rounded-lg overflow-hidden border"
                            >
                              <img
                                src={url}
                                alt={`survey-${idx}`}
                                className="w-full h-full object-cover hover:scale-105 transition"
                              />
                            </a>
                          )
                        )}
                      </div>
                    </div>
                  )}
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm space-y-1">
                    <p className="font-semibold text-blue-800">💰 Báo giá (Booking)</p>
                    <p>Tổng: {formatMoney(selectedJob.totalAmount) || "—"}</p>
                    <p>Cọc: {formatMoney(selectedJob.depositAmount) || "—"}</p>
                    <p>Còn lại: {formatMoney(selectedJob.remainingAmount) || "—"}</p>
                  </div>
                </div>
              </div>

              {/* Daily Reports View */}
              <div className="border border-orange-200 rounded-2xl overflow-hidden">
                <div className="bg-orange-50 px-4 py-3">
                  <h4 className="font-bold text-orange-800">
                    📅 BÁO CÁO TIẾN ĐỘ HẰNG NGÀY
                  </h4>
                </div>
                <div className="p-4">
                  {loadingDailyReports ? (
                    <div className="py-8 text-center text-slate-400">
                      Đang tải báo cáo ngày...
                    </div>
                  ) : dailyReports.length === 0 ? (
                    <div className="py-8 text-center text-slate-400">
                      Chưa có báo cáo ngày nào.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {dailyReports.map((report, index) => {
                        const images = splitImageUrls(report.progressImages);
                        return (
                          <div
                            key={report.id || index}
                            className="border border-slate-200 rounded-xl overflow-hidden"
                          >
                            <div className="bg-slate-50 px-4 py-3 flex justify-between gap-2">
                              <p className="font-bold text-slate-800">
                                📅 Báo cáo ngày {dailyReports.length - index}
                              </p>
                              <p className="text-xs text-slate-500">
                                {report.createdAt
                                  ? new Date(report.createdAt).toLocaleString(
                                      "vi-VN"
                                    )
                                  : ""}
                              </p>
                            </div>
                            <div className="p-4 space-y-2 text-sm">
                              <p className="whitespace-pre-wrap">{report.content}</p>
                              {images.length > 0 && (
                                <div className="grid grid-cols-3 gap-2 pt-2">
                                  {images.map((url, imgIdx) => (
                                    <a
                                      key={imgIdx}
                                      href={url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="aspect-square rounded-lg overflow-hidden border"
                                    >
                                      <img
                                        src={url}
                                        alt={`prog-${imgIdx}`}
                                        className="w-full h-full object-cover"
                                      />
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-slate-100 font-semibold text-slate-600 hover:bg-slate-200 rounded-xl text-sm transition"
                >
                  Đóng
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
