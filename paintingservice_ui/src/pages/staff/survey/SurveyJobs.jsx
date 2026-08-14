import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import AxiosConfig from "../../../util/AxiosConfig";
import { bookingDetailApi, splitImageUrls } from "../../../util/bookingDetailApi";

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
  const [modalType, setModalType] = useState(null); // 'report' | 'daily' | 'agreement' | 'view'
  const [submitting, setSubmitting] = useState(false);

  // Active Tab trong Modal View
  const [viewTab, setViewTab] = useState("overview"); // 'overview' | 'survey' | 'daily' | 'contract'

  // =========================================================
  // KHẢO SÁT & BÁO GIÁ FORM
  // =========================================================

  const [surveyNote, setSurveyNote] = useState("");
  const [materialNote, setMaterialNote] = useState("");
  const [materialShortage, setMaterialShortage] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [depositAmount, setDepositAmount] = useState("");

  // =========================================================
  // HỢP ĐỒNG & THỎA THUẬN FORM
  // =========================================================

  const [customerAgreed, setCustomerAgreed] = useState(true);
  const [contractContent, setContractContent] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [contractData, setContractData] = useState(null);

  const surveySigCanvasRef = useRef(null);
  const [surveySignatureDataUrl, setSurveySignatureDataUrl] = useState("");
  const [hasSurveySignature, setHasSurveySignature] = useState(false);

  // =========================================================
  // BÁO CÁO NGÀY
  // =========================================================

  const [dailyContent, setDailyContent] = useState("");
  const [dailyProgress, setDailyProgress] = useState("");
  const [dailyMaterialShortage, setDailyMaterialShortage] = useState("");
  const [dailyReports, setDailyReports] = useState([]);
  const [loadingDailyReports, setLoadingDailyReports] = useState(false);

  // =========================================================
  // ẢNH
  // =========================================================

  const [surveyImages, setSurveyImages] = useState([]);
  const [progressImages, setProgressImages] = useState([]);
  const [surveyPreviewUrls, setSurveyPreviewUrls] = useState([]);
  const [progressPreviewUrls, setProgressPreviewUrls] = useState([]);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState(null);

  // =========================================================
  // LOAD JOBS & BOOKING DETAILS
  // =========================================================

  const loadJobs = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading) setLoading(true);

        const res = await AxiosConfig.get("/staff/survey/jobs");
        const jobList = Array.isArray(res.data) ? res.data : [];
        setJobs(jobList);

        // Fetch detail cho từng booking song song
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
  // CLEANUP PREVIEW URL
  // =========================================================

  useEffect(() => {
    return () => {
      surveyPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
      progressPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [surveyPreviewUrls, progressPreviewUrls]);

  // =========================================================
  // SIGNATURE CANVAS
  // =========================================================

  const initSurveySignatureCanvas = useCallback(() => {
    const canvas = surveySigCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const parent = canvas.parentElement;
    const width = parent ? parent.clientWidth : 500;
    const height = 160;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  useEffect(() => {
    if (modalType === "agreement" && customerAgreed) {
      const t = setTimeout(() => initSurveySignatureCanvas(), 50);
      return () => clearTimeout(t);
    }
  }, [modalType, customerAgreed, initSurveySignatureCanvas]);

  useEffect(() => {
    const canvas = surveySigCanvasRef.current;
    if (!canvas || modalType !== "agreement" || !customerAgreed) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let drawing = false;
    let lastX = 0;
    let lastY = 0;

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    };

    const start = (e) => {
      e.preventDefault();
      drawing = true;
      const pos = getPos(e);
      lastX = pos.x;
      lastY = pos.y;
    };

    const move = (e) => {
      if (!drawing) return;
      e.preventDefault();
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      lastX = pos.x;
      lastY = pos.y;
      setHasSurveySignature(true);
    };

    const end = (e) => {
      if (!drawing) return;
      e.preventDefault();
      drawing = false;
      try {
        setSurveySignatureDataUrl(canvas.toDataURL("image/png"));
      } catch {
        // ignore
      }
    };

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", move);
    canvas.addEventListener("mouseup", end);
    canvas.addEventListener("mouseleave", end);
    canvas.addEventListener("touchstart", start, { passive: false });
    canvas.addEventListener("touchmove", move, { passive: false });
    canvas.addEventListener("touchend", end);
    canvas.addEventListener("touchcancel", end);

    return () => {
      canvas.removeEventListener("mousedown", start);
      canvas.removeEventListener("mousemove", move);
      canvas.removeEventListener("mouseup", end);
      canvas.removeEventListener("mouseleave", end);
      canvas.removeEventListener("touchstart", start);
      canvas.removeEventListener("touchmove", move);
      canvas.removeEventListener("touchend", end);
      canvas.removeEventListener("touchcancel", end);
    };
  }, [modalType, customerAgreed]);

  const clearSurveySignature = () => {
    const canvas = surveySigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const width = canvas.clientWidth || 500;
    const height = canvas.clientHeight || 160;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    setSurveySignatureDataUrl("");
    setHasSurveySignature(false);
  };

  // =========================================================
  // FILTER & SORT
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
          "WAITING_CUSTOMER_SIGNATURE",
          "CONTRACT_APPROVED",
          "ASSIGNED",
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
  // HELPER FORMATTERS
  // =========================================================

  const formatMoney = (value) => {
    if (value == null || value === "") return "—";
    return Number(value).toLocaleString("vi-VN") + " VNĐ";
  };

  // =========================================================
  // LOAD DAILY REPORTS & CONTRACTS
  // =========================================================

  const loadDailyReports = async (bookingId) => {
    if (!bookingId) {
      setDailyReports([]);
      return;
    }

    try {
      setLoadingDailyReports(true);
      const res = await AxiosConfig.get(`/daily-reports/booking/${bookingId}`);

      const raw = res.data;
      let list = [];

      if (Array.isArray(raw)) {
        list = raw;
      } else if (Array.isArray(raw?.content)) {
        list = raw.content;
      } else if (Array.isArray(raw?.data)) {
        list = raw.data;
      } else if (Array.isArray(raw?.items)) {
        list = raw.items;
      }

      list.sort((a, b) => {
        const tA = new Date(a.createdAt || 0).getTime();
        const tB = new Date(b.createdAt || 0).getTime();
        return tB - tA;
      });

      setDailyReports(list);
    } catch (err) {
      console.error("Lỗi lấy báo cáo ngày:", err);
      setDailyReports([]);
    } finally {
      setLoadingDailyReports(false);
    }
  };

  const loadContractForBooking = async (bookingId) => {
    try {
      const res = await AxiosConfig.get("/contracts");
      const list = Array.isArray(res.data) ? res.data : [];
      const found = list.find((c) => Number(c.bookingId) === Number(bookingId));
      setContractData(found || null);
    } catch (err) {
      console.warn("Lỗi tải thông tin hợp đồng:", err);
      setContractData(null);
    }
  };

  // =========================================================
  // ACCEPT / REJECT JOB
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
  // OPEN / CLOSE MODAL
  // =========================================================

  const openModal = async (job, type) => {
    setSelectedJob(job);
    setModalType(type);
    setViewTab("overview");
    setLoadingDetail(true);

    // Reset forms
    setSurveyNote("");
    setMaterialNote("");
    setMaterialShortage("");
    setTotalAmount(job.totalAmount != null ? String(job.totalAmount) : "");
    setDepositAmount(
      job.depositAmount != null ? String(job.depositAmount) : ""
    );
    setCustomerAgreed(true);
    setRejectReason("");
    setSurveySignatureDataUrl("");
    setHasSurveySignature(false);
    setDailyContent("");
    setDailyProgress("");
    setDailyMaterialShortage("");
    setDailyReports([]);
    setContractData(null);

    // Clear preview images
    surveyPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    progressPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    setSurveyImages([]);
    setProgressImages([]);
    setSurveyPreviewUrls([]);
    setProgressPreviewUrls([]);

    // Fetch fresh BookingDetail
    let currentDetail = detailsMap[job.id] || null;
    try {
      const details = await bookingDetailApi.list(job.id);
      if (details.length > 0) {
        currentDetail = details[0];
        setSelectedDetail(currentDetail);
        setDetailsMap((prev) => ({ ...prev, [job.id]: currentDetail }));
      } else {
        setSelectedDetail(null);
      }
    } catch (err) {
      console.warn("Lỗi fetch chi tiết booking:", err);
    } finally {
      setLoadingDetail(false);
    }

    if (type === "report") {
      setSurveyNote(currentDetail?.surveyNote || "");
      setMaterialNote(currentDetail?.materialNote || "");
      setMaterialShortage(currentDetail?.materialShortage || "");
      if (job.totalAmount != null) setTotalAmount(String(job.totalAmount));
      if (job.depositAmount != null) setDepositAmount(String(job.depositAmount));
    }

    if (type === "agreement") {
      const preferredName =
        job.preferredTechnicianName ||
        job.technicianName ||
        "đội thợ do khách chỉ định / hệ thống phân công";

      const priceBlock =
        job.totalAmount != null
          ? `\nTổng báo giá: ${formatMoney(job.totalAmount)}\n` +
            `Tiền cọc: ${formatMoney(job.depositAmount)}\n` +
            `Còn lại: ${formatMoney(job.remainingAmount)}\n`
          : "\n";

      setContractContent(
        `HỢP ĐỒNG SỬA CHỮA / CẢI TẠO\n\n` +
          `Mã đơn: #${job.id}\n` +
          `Khách hàng: ${job.customerName || "..."}\n` +
          `Địa chỉ công trình: ${job.address || "..."}\n` +
          `Dịch vụ: ${job.serviceName || "..."}\n` +
          priceBlock +
          `\nNội dung công việc (theo khảo sát):\n` +
          `${currentDetail?.surveyNote || job.description || "..."}\n\n` +
          `Vật tư dự kiến:\n` +
          `${currentDetail?.materialNote || "..."}\n\n` +
          `Đội thi công: ${preferredName}\n\n` +
          `Các bên cam kết thực hiện đúng nội dung đã thỏa thuận.`
      );
    }

    if (type === "view") {
      loadDailyReports(job.id);
      loadContractForBooking(job.id);
    }
  };

  const closeModal = () => {
    setSelectedJob(null);
    setSelectedDetail(null);
    setModalType(null);
    setSurveyNote("");
    setMaterialNote("");
    setMaterialShortage("");
    setTotalAmount("");
    setDepositAmount("");
    setCustomerAgreed(true);
    setContractContent("");
    setRejectReason("");
    setSurveySignatureDataUrl("");
    setHasSurveySignature(false);
    setDailyContent("");
    setDailyProgress("");
    setDailyMaterialShortage("");
    setDailyReports([]);
    setContractData(null);
    setSelectedPreviewImage(null);

    surveyPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    progressPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    setSurveyImages([]);
    setProgressImages([]);
    setSurveyPreviewUrls([]);
    setProgressPreviewUrls([]);
  };

  // =========================================================
  // IMAGES HANDLING
  // =========================================================

  const handleSelectImages = (e, type) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length === 0) {
      showToast?.("Chỉ chấp nhận file ảnh", "error");
      e.target.value = "";
      return;
    }

    const newPreviews = imageFiles.map((file) => URL.createObjectURL(file));

    if (type === "survey") {
      setSurveyImages((prev) => [...prev, ...imageFiles]);
      setSurveyPreviewUrls((prev) => [...prev, ...newPreviews]);
    }
    if (type === "progress") {
      setProgressImages((prev) => [...prev, ...imageFiles]);
      setProgressPreviewUrls((prev) => [...prev, ...newPreviews]);
    }
    e.target.value = "";
  };

  const removeSurveyPreview = (index) => {
    setSurveyPreviewUrls((prev) => {
      if (prev[index]) URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
    setSurveyImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeProgressPreview = (index) => {
    setProgressPreviewUrls((prev) => {
      if (prev[index]) URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
    setProgressImages((prev) => prev.filter((_, i) => i !== index));
  };

  // =========================================================
  // SUBMIT SURVEY REPORT (FIXED HOÀN CHỈNH)
  // =========================================================

  const handleSubmitSurveyReport = async () => {
    if (!selectedJob) return;

    if (
      !surveyNote.trim() &&
      !materialNote.trim() &&
      !materialShortage.trim()
    ) {
      showToast?.("Vui lòng nhập ít nhất nội dung khảo sát hoặc vật liệu", "error");
      return;
    }

    const total = Number(totalAmount);
    if (!totalAmount || Number.isNaN(total) || total <= 0) {
      showToast?.("Vui lòng nhập tổng báo giá hợp lệ (> 0)", "error");
      return;
    }

    let deposit = null;
    if (depositAmount !== "" && depositAmount != null) {
      deposit = Number(depositAmount);
      if (Number.isNaN(deposit) || deposit <= 0) {
        showToast?.("Tiền cọc không hợp lệ", "error");
        return;
      }
      if (deposit > total) {
        showToast?.("Tiền cọc không được lớn hơn tổng báo giá", "error");
        return;
      }
    }

    try {
      setSubmitting(true);

      // Bước 1: Lưu báo giá vào Booking qua StaffProfileController
      const pricePayload = {
        totalAmount: total,
      };
      if (deposit != null) pricePayload.depositAmount = deposit;

      await AxiosConfig.post(
        `/staff/survey/jobs/${selectedJob.id}/report`,
        pricePayload
      );

      // Bước 2: Tìm hoặc tạo BookingDetail cho đơn này
      let detail = selectedDetail;
      if (!detail) {
        const detailsList = await bookingDetailApi.list(selectedJob.id);
        if (detailsList.length > 0) {
          detail = detailsList[0];
        } else {
          detail = await bookingDetailApi.create(selectedJob.id);
        }
      }

      // Bước 3: Cập nhật thông tin khảo sát, vật liệu & upload ảnh lên Cloudinary
      await bookingDetailApi.updateSurvey(detail.id, {
        surveyNote: surveyNote.trim() || null,
        materialNote: materialNote.trim() || null,
        files: surveyImages,
      });

      // Bước 4: Nếu có thông tin thiếu vật liệu, cập nhật
      if (materialShortage.trim()) {
        await bookingDetailApi.reportShortage(detail.id, materialShortage.trim());
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

  // =========================================================
  // SUBMIT DAILY REPORT
  // =========================================================

  const handleSubmitDailyReport = async () => {
    if (!selectedJob) return;

    if (!dailyContent.trim()) {
      showToast?.("Vui lòng nhập nội dung báo cáo ngày", "error");
      return;
    }

    let progress = null;
    if (dailyProgress !== "" && dailyProgress != null) {
      progress = Number(dailyProgress);
      if (Number.isNaN(progress) || progress < 0 || progress > 100) {
        showToast?.("Tiến độ phải từ 0 đến 100%", "error");
        return;
      }
    }

    try {
      setSubmitting(true);

      await AxiosConfig.post(`/daily-reports/${selectedJob.id}`, {
        content: dailyContent.trim(),
        progressPercentage: progress,
        materialShortage: dailyMaterialShortage.trim() || null,
        progressImages: null,
      });

      if (progressImages.length > 0) {
        const formData = new FormData();
        progressImages.forEach((file) => formData.append("files", file));
        if (dailyContent.trim()) formData.append("note", dailyContent.trim());
        await AxiosConfig.post(
          `/daily-reports/${selectedJob.id}/progress-images`,
          formData,
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

  // =========================================================
  // SUBMIT AGREEMENT & CONTRACT
  // =========================================================

  const handleSubmitAgreement = async () => {
    if (!selectedJob) return;

    if (customerAgreed && !contractContent.trim()) {
      showToast?.("Vui lòng nhập nội dung hợp đồng", "error");
      return;
    }

    if (!customerAgreed && !rejectReason.trim()) {
      showToast?.("Vui lòng nhập lý do khách không đồng ý", "error");
      return;
    }

    if (customerAgreed) {
      let signature = surveySignatureDataUrl;
      if (!signature && surveySigCanvasRef.current && hasSurveySignature) {
        try {
          signature = surveySigCanvasRef.current.toDataURL("image/png");
        } catch {
          // ignore
        }
      }
      if (!signature || !hasSurveySignature) {
        showToast?.(
          "Vui lòng ký tên (chữ ký giám sát) trước khi gửi hợp đồng",
          "error"
        );
        return;
      }
    }

    try {
      setSubmitting(true);

      if (customerAgreed) {
        let signature = surveySignatureDataUrl;
        if (!signature && surveySigCanvasRef.current) {
          signature = surveySigCanvasRef.current.toDataURL("image/png");
        }

        const contractPayload = {
          bookingId: Number(selectedJob.id),
          contractCode: `HD-${selectedJob.id}-${Date.now()}`,
          content: contractContent.trim(),
          customerSigned: false,
          surveySigned: true,
          surveySignatureImg: signature,
        };

        await AxiosConfig.post("/contracts", contractPayload);

        showToast?.(
          "Đã lập hợp đồng (có chữ ký giám sát) & gửi thông báo cho Admin duyệt!",
          "success"
        );
      } else {
        await AxiosConfig.put(`/bookings/${selectedJob.id}`, {
          ...selectedJob,
          status: "CANCELLED",
          description:
            (selectedJob.description || "") +
            `\n[Lý do hủy sau khảo sát]: ${rejectReason.trim()}`,
        });

        showToast?.(
          "Đã báo cáo khách không đồng ý. Đơn đã được hủy.",
          "success"
        );
      }

      closeModal();
      loadJobs(false);
    } catch (err) {
      console.error(err);
      showToast?.(
        err.response?.data?.message ||
          "Lỗi khi gửi kết quả thỏa thuận / tạo hợp đồng",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================
  // SUPERVISOR ACCEPT (NGHIỆM THU)
  // =========================================================

  const handleSupervisorAccept = async (jobId) => {
    if (
      !window.confirm(
        "Xác nhận nghiệm thu công trình này?\n\n(Cần cả khách hàng xác nhận thì đơn mới chuyển sang Hoàn thành)"
      )
    ) {
      return;
    }

    try {
      let detail = detailsMap[jobId];
      if (!detail) {
        const detailsList = await bookingDetailApi.list(jobId);
        if (detailsList.length > 0) {
          detail = detailsList[0];
        } else {
          detail = await bookingDetailApi.create(jobId);
        }
      }

      await bookingDetailApi.supervisorAccept(detail.id);
      showToast?.(
        "Đã xác nhận nghiệm thu thành công! Chờ khách hàng xác nhận.",
        "success"
      );
      loadJobs(false);
    } catch (err) {
      console.error(err);
      showToast?.(
        err.response?.data?.message || "Không thể xác nhận nghiệm thu",
        "error"
      );
    }
  };

  // =========================================================
  // STATUS BADGE RENDERER
  // =========================================================

  const getStatusBadge = (status) => {
    const map = {
      PENDING: { text: "Chờ nhận việc", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
      SURVEY_ASSIGNED: { text: "Đã phân công khảo sát", color: "bg-blue-100 text-blue-800 border-blue-200" },
      ACCEPTED: { text: "Đã nhận việc", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
      SURVEYING: { text: "Đang khảo sát", color: "bg-purple-100 text-purple-800 border-purple-200" },
      WAITING_CONTRACT_APPROVAL: { text: "Chờ duyệt HĐ", color: "bg-cyan-100 text-cyan-800 border-cyan-200" },
      WAITING_CUSTOMER_SIGNATURE: { text: "Chờ khách ký HĐ", color: "bg-amber-100 text-amber-800 border-amber-200" },
      CONTRACT_APPROVED: { text: "HĐ đã duyệt", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
      ASSIGNED: { text: "Đã phân công thợ", color: "bg-teal-100 text-teal-800 border-teal-200" },
      PROCESSING: { text: "Đang thi công", color: "bg-orange-100 text-orange-800 border-orange-200" },
      WORKER_COMPLETED: { text: "Thợ hoàn thành", color: "bg-purple-100 text-purple-800 border-purple-200" },
      COMPLETED: { text: "Hoàn thành", color: "bg-green-100 text-green-800 border-green-200" },
      CANCELLED: { text: "Đã hủy", color: "bg-rose-100 text-rose-800 border-rose-200" },
    };

    const item = map[status] || {
      text: status || "Không xác định",
      color: "bg-slate-100 text-slate-600 border-slate-200",
    };

    return (
      <span
        className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full border ${item.color}`}
      >
        {item.text}
      </span>
    );
  };

  // =========================================================
  // LOADING STATE
  // =========================================================

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-500">
          Đang tải danh sách công việc khảo sát...
        </p>
      </div>
    );
  }

  // =========================================================
  // MAIN RENDER
  // =========================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Danh Sách Lịch Khảo Sát &amp; Giám Sát
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Quản lý tiếp nhận khảo sát, lập báo giá, báo cáo ngày và nghiệm thu công trình.
          </p>
        </div>
        <button
          onClick={() => loadJobs(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-sm font-semibold transition"
        >
          🔄 Làm mới danh sách
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3">
        <div className="relative">
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Tìm theo mã đơn, địa chỉ, dịch vụ, tên khách hàng..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            🔍
          </span>
        </div>

        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {[
              { key: "ALL", label: "Tất cả" },
              { key: "PENDING", label: "Chờ nhận" },
              { key: "IN_PROGRESS", label: "Đang tiến hành" },
              { key: "COMPLETED", label: "Hoàn thành / Hủy" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  statusFilter === f.key
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="newest">Ngày hẹn mới nhất</option>
            <option value="oldest">Ngày hẹn cũ nhất</option>
          </select>
        </div>

        <div className="flex justify-between items-center text-xs text-slate-400 pt-1">
          <span>
            Hiển thị <strong>{filteredJobs.length}</strong> / {jobs.length} đơn hàng
          </span>
        </div>
      </div>

      {/* Jobs List */}
      {filteredJobs.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl text-center text-slate-400 border border-slate-100 shadow-xs">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-base font-semibold text-slate-700">
            {jobs.length === 0
              ? "Chưa có công việc khảo sát nào được phân công."
              : "Không tìm thấy đơn hàng phù hợp với bộ lọc."}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Vui lòng kiểm tra lại trạng thái hoặc từ khóa tìm kiếm.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredJobs.map((job) => {
            const detail = detailsMap[job.id] || null;
            const status = job.status || "PENDING";

            const canAccept = ["PENDING", "SURVEY_ASSIGNED"].includes(status);
            const canReport = ["ACCEPTED", "SURVEYING"].includes(status);
            const hasSurveyReport = Boolean(
              detail?.surveyNote || detail?.materialNote || detail?.materialShortage
            );
            const canSubmitAgreement =
              hasSurveyReport && ["ACCEPTED", "SURVEYING"].includes(status);
            const canDailyReport = ["CONTRACT_APPROVED", "ASSIGNED", "PROCESSING"].includes(status);
            const canSupervisorAccept =
              status === "WORKER_COMPLETED" && (!detail || !detail.supervisorAccepted);

            const canViewReports = ![
              "PENDING",
              "SURVEY_ASSIGNED",
              "CANCELLED",
            ].includes(status);

            const hasTeam = job.technicianName || job.preferredTechnicianName;
            const hasQuote = job.totalAmount != null && Number(job.totalAmount) > 0;

            return (
              <div
                key={job.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 space-y-4"
              >
                {/* Top Section */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono font-black text-blue-600 text-base">
                        #{job.id}
                      </span>
                      <h3 className="font-bold text-slate-900 text-base">
                        {job.serviceName || "Dịch vụ sửa chữa"}
                      </h3>
                      {getStatusBadge(status)}
                    </div>

                    <p className="text-sm font-medium text-slate-700">
                      📍 {job.address || "Chưa có địa chỉ công trình"}
                    </p>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 pt-0.5">
                      <span>
                        📅 Hẹn:{" "}
                        <strong>
                          {job.appointmentDate
                            ? new Date(job.appointmentDate).toLocaleString("vi-VN", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "Chưa đặt lịch"}
                        </strong>
                      </span>
                      {job.customerName && (
                        <span>
                          👤 Khách hàng: <strong>{job.customerName}</strong>
                        </span>
                      )}
                    </div>

                    {job.description && (
                      <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 italic line-clamp-2">
                        &ldquo;{job.description}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* Financial Quick Glance */}
                  {hasQuote && (
                    <div className="sm:text-right bg-blue-50/60 border border-blue-100 p-3 rounded-xl min-w-[180px]">
                      <div className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">
                        Báo giá công trình
                      </div>
                      <div className="text-base font-black text-slate-900 mt-0.5">
                        {formatMoney(job.totalAmount)}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Cọc: {formatMoney(job.depositAmount)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Team / Survey Badges */}
                <div className="flex flex-wrap gap-2 items-center text-xs">
                  {hasTeam && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg font-medium">
                      👷 Đội thợ: {job.technicianName || job.preferredTechnicianName}
                      {job.technicianPhone && ` (${job.technicianPhone})`}
                    </span>
                  )}
                  {hasSurveyReport && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg font-semibold">
                      📝 Đã có báo cáo khảo sát
                    </span>
                  )}
                  {detail?.materialShortage && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg font-semibold">
                      ⚠️ Phát sinh thiếu vật tư
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                  {canAccept && (
                    <>
                      <button
                        onClick={() => handleAcceptJob(job.id)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                      >
                        ✓ Xác nhận nhận việc
                      </button>
                      <button
                        onClick={() => handleRejectJob(job.id)}
                        className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        ✕ Từ chối
                      </button>
                    </>
                  )}

                  {canReport && (
                    <button
                      onClick={() => openModal(job, "report")}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      📝 Gửi / Sửa báo cáo khảo sát
                    </button>
                  )}

                  {canSubmitAgreement && (
                    <button
                      onClick={() => openModal(job, "agreement")}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      📜 Báo cáo kết quả &amp; Lập hợp đồng
                    </button>
                  )}

                  {canDailyReport && (
                    <button
                      onClick={() => openModal(job, "daily")}
                      className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      📅 Gửi báo cáo ngày
                    </button>
                  )}

                  {canSupervisorAccept && (
                    <button
                      onClick={() => handleSupervisorAccept(job.id)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      🏆 Nghiệm thu (Giám sát)
                    </button>
                  )}

                  {canViewReports && (
                    <button
                      onClick={() => openModal(job, "view")}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      👁️ Xem chi tiết &amp; Báo cáo
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===================== MODAL CHÍNH ===================== */}
      {selectedJob && modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">
                  {modalType === "report" && `Báo Cáo Khảo Sát #${selectedJob.id}`}
                  {modalType === "daily" && `Báo Cáo Tiến Độ Ngày #${selectedJob.id}`}
                  {modalType === "agreement" && `Kết Quả Thỏa Thuận & Lập Hợp Đồng #${selectedJob.id}`}
                  {modalType === "view" && `Chi Tiết Hồ Sơ Đơn Hàng #${selectedJob.id}`}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedJob.serviceName} • {selectedJob.address}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 text-lg transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {loadingDetail && (
                <div className="p-3 bg-blue-50 text-blue-700 text-xs rounded-xl animate-pulse font-medium">
                  Đang tải thông tin chi tiết đơn hàng...
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB / MODAL: VIEW CHI TIẾT ĐẦY ĐỦ                         */}
              {/* ========================================================= */}
              {modalType === "view" && (
                <div className="space-y-5">
                  {/* Sub-tabs Navigation */}
                  <div className="flex border-b border-slate-200 gap-2">
                    {[
                      { key: "overview", label: "📌 Tổng quan" },
                      { key: "survey", label: "🔍 Khảo sát & Vật tư" },
                      { key: "daily", label: `📅 Tiến độ ngày (${dailyReports.length})` },
                      { key: "contract", label: "📜 Hợp đồng" },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setViewTab(tab.key)}
                        className={`pb-3 px-3 text-xs font-bold border-b-2 transition cursor-pointer ${
                          viewTab === tab.key
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* TAB: OVERVIEW */}
                  {viewTab === "overview" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                          <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                            👤 Thông tin khách hàng &amp; Công trình
                          </h4>
                          <div className="text-xs space-y-1.5 text-slate-600">
                            <p><strong>Khách hàng:</strong> {selectedJob.customerName || "—"}</p>
                            <p><strong>Địa chỉ:</strong> {selectedJob.address || "—"}</p>
                            <p>
                              <strong>Ngày hẹn khảo sát:</strong>{" "}
                              {selectedJob.appointmentDate
                                ? new Date(selectedJob.appointmentDate).toLocaleString("vi-VN")
                                : "—"}
                            </p>
                            <p><strong>Dịch vụ:</strong> {selectedJob.serviceName || "—"}</p>
                            <p><strong>Trạng thái:</strong> {getStatusBadge(selectedJob.status)}</p>
                          </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                          <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                            💰 Tài chính &amp; Báo giá
                          </h4>
                          <div className="text-xs space-y-1.5 text-slate-600">
                            <p><strong>Tổng báo giá:</strong> <span className="font-bold text-blue-600 text-sm">{formatMoney(selectedJob.totalAmount)}</span></p>
                            <p><strong>Tiền cọc:</strong> {formatMoney(selectedJob.depositAmount)}</p>
                            <p><strong>Còn lại:</strong> {formatMoney(selectedJob.remainingAmount)}</p>
                            <p>
                              <strong>Trạng thái thanh toán:</strong>{" "}
                              <span className="font-semibold text-slate-800">
                                {selectedJob.paymentStatus || "UNPAID"}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">
                          Yêu cầu ban đầu của khách hàng:
                        </label>
                        <div className="bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {selectedJob.description || "Không có mô tả ban đầu"}
                        </div>
                      </div>

                      {/* Team Info */}
                      <div className="bg-emerald-50/60 border border-emerald-100 p-4 rounded-2xl space-y-2">
                        <h4 className="font-bold text-emerald-900 text-sm flex items-center gap-1.5">
                          👷 Đội ngũ thi công &amp; Giám sát
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-emerald-800">
                          <p><strong>Thợ phụ trách:</strong> {selectedJob.technicianName || selectedJob.preferredTechnicianName || "Chưa phân công"}</p>
                          <p><strong>Số điện thoại thợ:</strong> {selectedJob.technicianPhone || "—"}</p>
                        </div>
                      </div>

                      {/* Acceptance Status */}
                      <div className="bg-purple-50 border border-purple-100 p-4 rounded-2xl space-y-2">
                        <h4 className="font-bold text-purple-900 text-sm flex items-center gap-1.5">
                          🏆 Trạng thái nghiệm thu
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div className="flex items-center gap-2">
                            <span>Giám sát:</span>
                            {selectedDetail?.supervisorAccepted ? (
                              <span className="font-bold text-emerald-600">✓ Đã nghiệm thu</span>
                            ) : (
                              <span className="text-amber-600 font-medium">Chưa nghiệm thu</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span>Khách hàng:</span>
                            {selectedDetail?.customerAccepted ? (
                              <span className="font-bold text-emerald-600">✓ Đã nghiệm thu</span>
                            ) : (
                              <span className="text-amber-600 font-medium">Chưa nghiệm thu</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB: SURVEY & MATERIALS */}
                  {viewTab === "survey" && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Nội dung khảo sát hiện trạng:
                        </label>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 whitespace-pre-wrap min-h-[80px]">
                          {selectedDetail?.surveyNote || "Chưa có nội dung ghi chú khảo sát."}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Vật tư &amp; Giá dự kiến:
                        </label>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 whitespace-pre-wrap">
                          {selectedDetail?.materialNote || "Chưa có thông tin vật tư."}
                        </div>
                      </div>

                      {selectedDetail?.materialShortage && (
                        <div>
                          <label className="block text-xs font-bold text-amber-800 mb-1 flex items-center gap-1">
                            ⚠️ Phát sinh thiếu vật tư / vật liệu cần bổ sung:
                          </label>
                          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 whitespace-pre-wrap">
                            {selectedDetail.materialShortage}
                          </div>
                        </div>
                      )}

                      {/* Survey Images */}
                      {splitImageUrls(selectedDetail?.surveyImages).length > 0 && (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-2">
                            📷 Ảnh chụp khảo sát hiện trường:
                          </label>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                            {splitImageUrls(selectedDetail.surveyImages).map((url, idx) => (
                              <div
                                key={idx}
                                onClick={() => setSelectedPreviewImage(url)}
                                className="aspect-square rounded-xl overflow-hidden border border-slate-200 cursor-pointer group relative shadow-xs"
                              >
                                <img
                                  src={url}
                                  alt={`survey-${idx}`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold">
                                  🔍 Xem ảnh
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB: DAILY REPORTS */}
                  {viewTab === "daily" && (
                    <div className="space-y-4">
                      {loadingDailyReports ? (
                        <div className="py-8 text-center text-slate-400 text-xs">
                          Đang tải báo cáo ngày...
                        </div>
                      ) : dailyReports.length === 0 ? (
                        <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                          <p className="text-sm font-semibold text-slate-600">Chưa có báo cáo ngày nào.</p>
                          <p className="text-xs text-slate-400 mt-1">Khi bắt đầu thi công, các báo cáo sẽ xuất hiện ở đây.</p>
                        </div>
                      ) : (
                        <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
                          {dailyReports.map((report, index) => {
                            const images = splitImageUrls(report.progressImages);
                            return (
                              <div
                                key={report.id || index}
                                className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs"
                              >
                                <div className="bg-slate-50 px-4 py-3 flex justify-between items-center border-b border-slate-100">
                                  <div>
                                    <span className="font-bold text-slate-800 text-xs">
                                      📅 Báo cáo ngày {dailyReports.length - index}
                                    </span>
                                    <span className="text-slate-400 text-[11px] ml-2">
                                      bởi {report.reporterName || report.createdByName || "Thợ / Giám sát"}
                                    </span>
                                  </div>
                                  <span className="text-[11px] text-slate-400">
                                    {report.createdAt ? new Date(report.createdAt).toLocaleString("vi-VN") : ""}
                                  </span>
                                </div>

                                <div className="p-4 space-y-3 bg-white">
                                  <div>
                                    <p className="text-xs text-slate-700 whitespace-pre-wrap">
                                      {report.content || "Không có nội dung"}
                                    </p>
                                  </div>

                                  {report.progressPercentage != null && (
                                    <div className="space-y-1">
                                      <div className="flex justify-between text-[11px]">
                                        <span className="text-slate-500 font-semibold">Tiến độ công trình:</span>
                                        <span className="font-bold text-orange-600">{report.progressPercentage}%</span>
                                      </div>
                                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                          className="h-full bg-orange-500 rounded-full"
                                          style={{ width: `${Math.min(100, Math.max(0, report.progressPercentage))}%` }}
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {report.materialShortage && (
                                    <div className="bg-amber-50 p-2.5 rounded-xl text-xs text-amber-800 border border-amber-200">
                                      ⚠️ <strong>Phát sinh:</strong> {report.materialShortage}
                                    </div>
                                  )}

                                  {images.length > 0 && (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                                      {images.map((url, imgIndex) => (
                                        <div
                                          key={imgIndex}
                                          onClick={() => setSelectedPreviewImage(url)}
                                          className="aspect-square rounded-lg overflow-hidden border border-slate-200 cursor-pointer hover:opacity-90"
                                        >
                                          <img src={url} alt={`daily-${imgIndex}`} className="w-full h-full object-cover" />
                                        </div>
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
                  )}

                  {/* TAB: CONTRACT */}
                  {viewTab === "contract" && (
                    <div className="space-y-4">
                      {contractData ? (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                            <div>
                              <p className="font-bold text-slate-800">Mã hợp đồng: {contractData.contractCode}</p>
                              <p className="text-slate-500 mt-0.5">
                                Tạo ngày: {contractData.createdAt ? new Date(contractData.createdAt).toLocaleDateString("vi-VN") : "—"}
                              </p>
                            </div>
                            <div>
                              {contractData.customerSigned ? (
                                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-full">
                                  ✓ Khách đã ký
                                </span>
                              ) : (
                                <span className="px-3 py-1 bg-amber-100 text-amber-800 font-bold rounded-full">
                                  ⏳ Chờ khách ký
                                </span>
                              )}
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Nội dung hợp đồng:</label>
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-mono text-slate-800 whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                              {contractData.content || "Chưa có nội dung hợp đồng"}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            {contractData.surveySignatureImg && (
                              <div className="space-y-1.5">
                                <span className="text-xs font-bold text-slate-600">Chữ ký Giám sát:</span>
                                <div className="border border-slate-200 rounded-xl p-2 bg-white flex justify-center">
                                  <img src={contractData.surveySignatureImg} alt="Giám sát ký" className="max-h-24 object-contain" />
                                </div>
                              </div>
                            )}
                            {contractData.customerSignatureImg && (
                              <div className="space-y-1.5">
                                <span className="text-xs font-bold text-slate-600">Chữ ký Khách hàng:</span>
                                <div className="border border-slate-200 rounded-xl p-2 bg-white flex justify-center">
                                  <img src={contractData.customerSignatureImg} alt="Khách ký" className="max-h-24 object-contain" />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                          <p className="text-sm font-semibold text-slate-600">Chưa có hợp đồng nào được tạo cho đơn này.</p>
                          <p className="text-xs text-slate-400 mt-1">Sau khi khảo sát, bạn có thể lập hợp đồng ở mục Thỏa thuận.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================= */}
              {/* MODAL FORM: BÁO CÁO KHẢO SÁT & BÁO GIÁ                    */}
              {/* ========================================================= */}
              {modalType === "report" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nội dung khảo sát hiện trạng *
                    </label>
                    <textarea
                      value={surveyNote}
                      onChange={(e) => setSurveyNote(e.target.value)}
                      rows={4}
                      placeholder="Mô tả hiện trạng công trình, diện tích, độ ẩm tường, các hạng mục cần khắc phục..."
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Vật tư &amp; Giá dự kiến
                    </label>
                    <textarea
                      value={materialNote}
                      onChange={(e) => setMaterialNote(e.target.value)}
                      rows={3}
                      placeholder="Liệt kê loại sơn, số lượng thùng/lon, bột bả, keo chống thấm..."
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Tổng báo giá (VNĐ) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={totalAmount}
                        onChange={(e) => setTotalAmount(e.target.value)}
                        placeholder="Ví dụ: 8000000"
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Tiền cọc yêu cầu (VNĐ)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        placeholder="Để trống = Mặc định 30%"
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Phát sinh / Thiếu vật liệu (nếu có)
                    </label>
                    <textarea
                      value={materialShortage}
                      onChange={(e) => setMaterialShortage(e.target.value)}
                      rows={2}
                      placeholder="Ghi chú nếu cần đặt thêm vật tư đặc biệt..."
                      className="w-full border border-amber-200 rounded-xl px-3.5 py-2 text-xs bg-amber-50/40"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      📷 Ảnh chụp khảo sát hiện trường
                    </label>
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/40 transition">
                      <span className="text-xl mb-1">📸</span>
                      <p className="text-xs text-slate-500">
                        Nhấp để chọn ảnh khảo sát hiện trường
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => handleSelectImages(e, "survey")}
                      />
                    </label>

                    {surveyPreviewUrls.length > 0 && (
                      <div className="mt-3 grid grid-cols-4 gap-2">
                        {surveyPreviewUrls.map((url, index) => (
                          <div
                            key={index}
                            className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group shadow-xs"
                          >
                            <img
                              src={url}
                              alt={`survey-preview-${index}`}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeSurveyPreview(index)}
                              className="absolute top-1 right-1 w-5 h-5 bg-rose-600 text-white rounded-full text-xs font-bold flex items-center justify-center shadow-md cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* MODAL FORM: BÁO CÁO NGÀY                                  */}
              {/* ========================================================= */}
              {modalType === "daily" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nội dung công việc hôm nay *
                    </label>
                    <textarea
                      value={dailyContent}
                      onChange={(e) => setDailyContent(e.target.value)}
                      rows={4}
                      placeholder="Mô tả công việc đã làm trong ngày, các khu vực đã sơn/xử lý..."
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Tiến độ hoàn thành tổng thể (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={dailyProgress}
                        onChange={(e) => setDailyProgress(e.target.value)}
                        placeholder="Ví dụ: 45"
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold text-orange-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Vật liệu thiếu / Cần mua thêm
                      </label>
                      <input
                        type="text"
                        value={dailyMaterialShortage}
                        onChange={(e) => setDailyMaterialShortage(e.target.value)}
                        placeholder="Ví dụ: Thiếu 1 cuộn băng keo giấy"
                        className="w-full border border-amber-200 rounded-xl px-3.5 py-2 text-xs bg-amber-50/40"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      📷 Ảnh tiến độ thi công hôm nay
                    </label>
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer hover:border-orange-400 hover:bg-orange-50/40 transition">
                      <span className="text-xl mb-1">📸</span>
                      <p className="text-xs text-slate-500">
                        Chọn ảnh chụp tiến độ trong ngày
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => handleSelectImages(e, "progress")}
                      />
                    </label>

                    {progressPreviewUrls.length > 0 && (
                      <div className="mt-3 grid grid-cols-4 gap-2">
                        {progressPreviewUrls.map((url, index) => (
                          <div
                            key={index}
                            className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group shadow-xs"
                          >
                            <img
                              src={url}
                              alt={`progress-preview-${index}`}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeProgressPreview(index)}
                              className="absolute top-1 right-1 w-5 h-5 bg-rose-600 text-white rounded-full text-xs font-bold flex items-center justify-center shadow-md cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* MODAL FORM: AGREEMENT & CONTRACT                          */}
              {/* ========================================================= */}
              {modalType === "agreement" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Khách hàng có đồng ý phương án &amp; báo giá không?
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setCustomerAgreed(true)}
                        className={`py-3 rounded-xl text-xs font-bold border-2 transition cursor-pointer flex items-center justify-center gap-2 ${
                          customerAgreed
                            ? "border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        ✅ Khách đồng ý làm
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomerAgreed(false)}
                        className={`py-3 rounded-xl text-xs font-bold border-2 transition cursor-pointer flex items-center justify-center gap-2 ${
                          !customerAgreed
                            ? "border-rose-600 bg-rose-50 text-rose-800 shadow-xs"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        ❌ Khách không đồng ý
                      </button>
                    </div>
                  </div>

                  {customerAgreed ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Nội dung hợp đồng thi công:
                        </label>
                        <textarea
                          value={contractContent}
                          onChange={(e) => setContractContent(e.target.value)}
                          rows={10}
                          className="w-full border border-slate-200 rounded-xl p-3 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="block text-xs font-bold text-slate-700">
                            Chữ ký Giám sát / Khảo sát viên *
                          </label>
                          <button
                            type="button"
                            onClick={clearSurveySignature}
                            className="text-xs text-rose-600 hover:underline font-bold"
                          >
                            Xóa chữ ký
                          </button>
                        </div>
                        <div className="border-2 border-dashed border-slate-300 rounded-2xl bg-white overflow-hidden touch-none">
                          <canvas
                            ref={surveySigCanvasRef}
                            className="w-full cursor-crosshair block"
                            style={{ height: 150, touchAction: "none" }}
                          />
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {hasSurveySignature ? (
                            <span className="text-emerald-600 font-bold">✓ Đã ký tên xác nhận</span>
                          ) : (
                            <span className="text-amber-600 font-semibold">⚠️ Vui lòng ký tên vào khung trước khi gửi hợp đồng</span>
                          )}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Lý do khách hàng không đồng ý / Hủy đơn:
                      </label>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={4}
                        placeholder="Nhập lý do khách hàng từ chối (giá cao, thay đổi kế hoạch...)"
                        className="w-full border border-rose-200 bg-rose-50/40 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
              <button
                onClick={closeModal}
                disabled={submitting}
                className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                {modalType === "view" ? "Đóng" : "Hủy bỏ"}
              </button>

              {modalType !== "view" && (
                <button
                  onClick={
                    modalType === "report"
                      ? handleSubmitSurveyReport
                      : modalType === "daily"
                      ? handleSubmitDailyReport
                      : handleSubmitAgreement
                  }
                  disabled={submitting}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
                >
                  {submitting
                    ? "Đang xử lý..."
                    : modalType === "agreement"
                    ? customerAgreed
                      ? "Lập Hợp Đồng & Gửi Admin Duyệt"
                      : "Xác Nhận Hủy Đơn"
                    : modalType === "daily"
                    ? "Gửi Báo Cáo Ngày"
                    : "Lưu & Gửi Báo Cáo Khảo Sát"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox / Modal xem ảnh phóng to */}
      {selectedPreviewImage && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4 cursor-pointer"
          onClick={() => setSelectedPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={selectedPreviewImage}
              alt="Preview"
              className="max-h-[85vh] max-w-full rounded-2xl shadow-2xl object-contain"
            />
            <button
              onClick={() => setSelectedPreviewImage(null)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-white text-slate-900 rounded-full font-bold shadow-lg flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}