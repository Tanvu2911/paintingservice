import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import {
  RefreshCw,
  Search,
  ClipboardList,
  LayoutGrid,
  List,
  ChevronRight,
  Filter,
} from "lucide-react";
import AxiosConfig from "../../../util/AxiosConfig";
import { bookingDetailApi, splitImageUrls } from "../../../util/bookingDetailApi";
import ImageLightboxModal from "../../../components/common/ImageLightboxModal";
import Pagination from "../../../components/common/Pagination";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import PromptDialog from "../../../components/common/PromptDialog";
import { parseHanoiAddress, HANOI_DISTRICTS } from "../../../data/hanoiLocations";
import { formatMoney } from "../../../util/formatters";

// Sub-components tách theo Single Responsibility Principle (SRP)
import SurveyJobsTable from "./components/SurveyJobsTable";
import SurveyJobsGrid from "./components/SurveyJobsGrid";
import SurveyReportModal from "./components/SurveyReportModal";
import SurveyDailyReportModal from "./components/SurveyDailyReportModal";
import SurveyAgreementModal from "./components/SurveyAgreementModal";
import SurveyJobDetailModal from "./components/SurveyJobDetailModal";

export default function SurveyJobs() {
  const context = useOutletContext() || {};
  const showToast = context.showToast;

  // =========================================================
  // STATE
  // =========================================================

  const [jobs, setJobs] = useState([]);
  const [detailsMap, setDetailsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [viewMode, setViewMode] = useState("table"); // 'table' | 'grid'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [modalType, setModalType] = useState(null); // 'report' | 'daily' | 'agreement' | 'view'
  const [submitting, setSubmitting] = useState(false);

  // Prompt & Confirm Dialog States
  const [promptReject, setPromptReject] = useState(null);
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);
  const [confirmAcceptance, setConfirmAcceptance] = useState(null);
  const [isSubmittingAcceptance, setIsSubmittingAcceptance] = useState(false);

  // Active Tab trong Modal View
  const [viewTab, setViewTab] = useState("overview");

  // Form Khảo sát & Báo giá
  const [surveyNote, setSurveyNote] = useState("");
  const [materialNote, setMaterialNote] = useState("");
  const [materialShortage, setMaterialShortage] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [depositAmount, setDepositAmount] = useState("");

  // Form Hợp đồng & Thỏa thuận
  const [customerAgreed, setCustomerAgreed] = useState(true);
  const [contractContent, setContractContent] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [contractData, setContractData] = useState(null);

  const surveySigCanvasRef = useRef(null);
  const [surveySignatureDataUrl, setSurveySignatureDataUrl] = useState("");
  const [hasSurveySignature, setHasSurveySignature] = useState(false);

  // Form Báo cáo ngày
  const [dailyContent, setDailyContent] = useState("");
  const [dailyProgress, setDailyProgress] = useState("");
  const [dailyMaterialShortage, setDailyMaterialShortage] = useState("");
  const [dailyMaterialCost, setDailyMaterialCost] = useState("");
  const [dailyReports, setDailyReports] = useState([]);
  const [loadingDailyReports, setLoadingDailyReports] = useState(false);

  // Ảnh
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

        const detailPromises = jobList.map(async (j) => {
          try {
            const details = await bookingDetailApi.list(j.id);
            return { bookingId: j.id, detail: details[0] || null };
          } catch (err) {
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
        showToast?.(
          err.response?.data?.message || "Không thể lấy danh sách công việc khảo sát",
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
      return { x: clientX - rect.left, y: clientY - rect.top };
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
  // COUNTS & FILTERS
  // =========================================================

  const counts = useMemo(() => {
    const total = jobs.length;
    const pending = jobs.filter((j) =>
      ["PENDING", "SURVEY_ASSIGNED"].includes(j.status)
    ).length;
    const inSurvey = jobs.filter((j) =>
      [
        "ACCEPTED",
        "SURVEYING",
        "WAITING_ADMIN_QUOTE",
        "WAITING_CONTRACT_APPROVAL",
        "WAITING_CUSTOMER_SIGNATURE",
        "WAITING_DEPOSIT",
      ].includes(j.status)
    ).length;
    const inProgress = jobs.filter((j) =>
      ["DEPOSIT_CONFIRMED", "CONTRACT_APPROVED", "ASSIGNED", "PROCESSING"].includes(
        j.status
      )
    ).length;
    const acceptance = jobs.filter(
      (j) => j.status === "WORKER_COMPLETED"
    ).length;
    const completed = jobs.filter((j) =>
      ["COMPLETED", "PAID_TO_STAFF"].includes(j.status)
    ).length;
    const cancelled = jobs.filter((j) =>
      ["CANCELLED", "SURVEY_REJECTED", "WORKER_REJECTED"].includes(j.status)
    ).length;

    return { total, pending, inSurvey, inProgress, acceptance, completed, cancelled };
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    let result = [...jobs];

    if (statusFilter === "PENDING") {
      result = result.filter((j) =>
        ["PENDING", "SURVEY_ASSIGNED"].includes(j.status)
      );
    } else if (statusFilter === "IN_SURVEY") {
      result = result.filter((j) =>
        [
          "ACCEPTED",
          "SURVEYING",
          "WAITING_ADMIN_QUOTE",
          "WAITING_CONTRACT_APPROVAL",
          "WAITING_CUSTOMER_SIGNATURE",
          "WAITING_DEPOSIT",
        ].includes(j.status)
      );
    } else if (statusFilter === "IN_PROGRESS") {
      result = result.filter((j) =>
        ["DEPOSIT_CONFIRMED", "CONTRACT_APPROVED", "ASSIGNED", "PROCESSING"].includes(
          j.status
        )
      );
    } else if (statusFilter === "ACCEPTANCE") {
      result = result.filter((j) => j.status === "WORKER_COMPLETED");
    } else if (statusFilter === "COMPLETED") {
      result = result.filter((j) =>
        ["COMPLETED", "PAID_TO_STAFF"].includes(j.status)
      );
    } else if (statusFilter === "CANCELLED") {
      result = result.filter((j) =>
        ["CANCELLED", "SURVEY_REJECTED", "WORKER_REJECTED"].includes(j.status)
      );
    }

    if (selectedDistrict) {
      result = result.filter((j) => {
        const parsed = parseHanoiAddress(j.address || "");
        return parsed.district === selectedDistrict;
      });
    }

    if (searchText.trim()) {
      const q = searchText.toLowerCase().trim();
      result = result.filter(
        (j) =>
          (j.address || "").toLowerCase().includes(q) ||
          (j.serviceName || "").toLowerCase().includes(q) ||
          (j.customerName || "").toLowerCase().includes(q) ||
          (j.technicianName || "").toLowerCase().includes(q) ||
          String(j.id).includes(q)
      );
    }

    result.sort((a, b) => {
      if (sortOrder === "newest") {
        const dateA = new Date(a.appointmentDate || a.bookingDate || a.createdAt || 0).getTime();
        const dateB = new Date(b.appointmentDate || b.bookingDate || b.createdAt || 0).getTime();
        return dateB - dateA;
      }
      if (sortOrder === "oldest") {
        const dateA = new Date(a.appointmentDate || a.bookingDate || a.createdAt || 0).getTime();
        const dateB = new Date(b.appointmentDate || b.bookingDate || b.createdAt || 0).getTime();
        return dateA - dateB;
      }
      if (sortOrder === "price_desc") {
        return Number(b.totalAmount || 0) - Number(a.totalAmount || 0);
      }
      if (sortOrder === "price_asc") {
        return Number(a.totalAmount || 0) - Number(b.totalAmount || 0);
      }
      return Number(b.id) - Number(a.id);
    });

    return result;
  }, [jobs, searchText, statusFilter, selectedDistrict, sortOrder]);

  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage) || 1;
  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredJobs.slice(start, start + itemsPerPage);
  }, [filteredJobs, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, statusFilter, selectedDistrict, sortOrder]);

  // =========================================================
  // ACTIONS & HANDLERS
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
      let list = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.content)
          ? raw.content
          : Array.isArray(raw?.data)
            ? raw.data
            : [];
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setDailyReports(list);
    } catch (err) {
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
      setContractData(null);
    }
  };

  const handleAcceptJob = async (jobId) => {
    try {
      await AxiosConfig.put(`/staff/survey/jobs/${jobId}/accept`);
      showToast?.("Đã xác nhận nhận việc khảo sát!", "success");
      loadJobs(false);
    } catch (err) {
      showToast?.(err.response?.data?.message || "Lỗi khi nhận việc", "error");
    }
  };

  const handleRejectJob = (jobId) => {
    setPromptReject({ jobId });
  };

  const submitRejectJob = async (reason) => {
    if (!promptReject?.jobId) return;
    try {
      setIsSubmittingReject(true);
      await AxiosConfig.post(`/bookings/${promptReject.jobId}/reject-survey`, {
        reason: reason.trim(),
      });
      showToast?.("Đã từ chối nhận việc khảo sát!", "success");
      setPromptReject(null);
      loadJobs(false);
    } catch (err) {
      showToast?.(err.response?.data?.message || "Lỗi khi từ chối nhận việc", "error");
    } finally {
      setIsSubmittingReject(false);
    }
  };

  const openModal = async (job, type) => {
    setSelectedJob(job);
    setModalType(type);
    setViewTab("overview");
    setLoadingDetail(true);

    setSurveyNote("");
    setMaterialNote("");
    setMaterialShortage("");
    setTotalAmount(job.totalAmount != null ? String(job.totalAmount) : "");
    setDepositAmount(job.depositAmount != null ? String(job.depositAmount) : "");
    setCustomerAgreed(true);
    setRejectReason("");
    setSurveySignatureDataUrl("");
    setHasSurveySignature(false);
    setDailyContent("");
    setDailyProgress("");
    setDailyMaterialShortage("");
    setDailyReports([]);
    setContractData(null);

    surveyPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    progressPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    setSurveyImages([]);
    setProgressImages([]);
    setSurveyPreviewUrls([]);
    setProgressPreviewUrls([]);

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
      // ignore
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
          ? `\nTổng báo giá: ${formatMoney(job.totalAmount)}\nTiền cọc: ${formatMoney(
            job.depositAmount
          )}\nCòn lại: ${formatMoney(job.remainingAmount)}\n`
          : "\n";

      setContractContent(
        `HỢP ĐỒNG SỬA CHỮA / CẢI TẠO\n\nMã đơn: #${job.id}\nKhách hàng: ${job.customerName || "..."
        }\nĐịa chỉ công trình: ${job.address || "..."}\nDịch vụ: ${job.serviceName || "..."
        }\n${priceBlock}\nNội dung công việc (theo khảo sát):\n${currentDetail?.surveyNote || job.description || "..."
        }\n\nVật tư dự kiến:\n${currentDetail?.materialNote || "..."
        }\n\nĐội thi công: ${preferredName}\n\nCác bên cam kết thực hiện đúng nội dung đã thỏa thuận.`
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

  const handleSubmitSurveyReport = async () => {
    if (!selectedJob) return;
    if (!surveyNote.trim() && !materialNote.trim()) {
      showToast?.("Vui lòng nhập ít nhất nội dung khảo sát hoặc vật liệu", "error");
      return;
    }

    try {
      setSubmitting(true);
      await AxiosConfig.post(`/staff/survey/jobs/${selectedJob.id}/report`, {});

      let detail = selectedDetail;
      if (!detail) {
        const detailsList = await bookingDetailApi.list(selectedJob.id);
        if (detailsList.length > 0) {
          detail = detailsList[0];
        } else {
          detail = await bookingDetailApi.create(selectedJob.id);
        }
      }

      await bookingDetailApi.updateSurvey(detail.id, {
        surveyNote: surveyNote.trim() || null,
        materialNote: materialNote.trim() || null,
        files: surveyImages,
      });

      showToast?.("Đã gửi báo cáo khảo sát & báo giá thành công!", "success");
      closeModal();
      loadJobs(false);
    } catch (err) {
      showToast?.(err.response?.data?.message || "Lỗi khi gửi báo cáo khảo sát", "error");
    } finally {
      setSubmitting(false);
    }
  };

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
      const materialCostNum = dailyMaterialCost ? Number(dailyMaterialCost) : 0;

      await AxiosConfig.post(`/daily-reports/${selectedJob.id}`, {
        content: dailyContent.trim(),
        progressPercentage: progress,
        materialShortage: dailyMaterialShortage.trim() || null,
        materialCost: isNaN(materialCostNum) ? 0 : materialCostNum,
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
      showToast?.(err.response?.data?.message || "Lỗi khi gửi báo cáo ngày", "error");
    } finally {
      setSubmitting(false);
    }
  };

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
        showToast?.("Vui lòng ký tên (chữ ký giám sát) trước khi gửi hợp đồng", "error");
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
        showToast?.("Đã báo cáo khách không đồng ý. Đơn đã được hủy.", "success");
      }

      closeModal();
      loadJobs(false);
    } catch (err) {
      showToast?.(
        err.response?.data?.message || "Lỗi khi gửi kết quả thỏa thuận / tạo hợp đồng",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSupervisorAccept = (jobId) => {
    setConfirmAcceptance({ jobId });
  };

  const submitSupervisorAccept = async () => {
    if (!confirmAcceptance?.jobId) return;
    try {
      setIsSubmittingAcceptance(true);
      const jobId = confirmAcceptance.jobId;
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
      showToast?.("Đã xác nhận nghiệm thu thành công! Chờ khách hàng xác nhận.", "success");
      setConfirmAcceptance(null);
      loadJobs(false);
    } catch (err) {
      showToast?.(err.response?.data?.message || "Lỗi khi nghiệm thu", "error");
    } finally {
      setIsSubmittingAcceptance(false);
    }
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden bg-linear-to-br from-blue-700 via-blue-800 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-950/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-blue-100 text-xs font-semibold border border-white/10">
              <span>Hệ thống Giám Sát Viên</span>
              <ChevronRight className="w-3.5 h-3.5 text-blue-200" />
              <span>Nhiệm vụ &amp; Khảo sát</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>Công Việc Khảo Sát</span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/30 text-blue-200 font-bold border border-blue-400/30">
                {jobs.length} công trình
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 max-w-2xl leading-relaxed">
              Tiếp nhận phân công khảo sát hiện trường tại Hà Nội, lập báo cáo vật tư,
              thỏa thuận hợp đồng và nghiệm thu chất lượng bàn giao.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              onClick={() => {
                setRefreshing(true);
                loadJobs(false).finally(() => setRefreshing(false));
              }}
              disabled={loading || refreshing}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-xs backdrop-blur-md border border-white/20 transition flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              <span>{refreshing ? "Đang đồng bộ..." : "Làm mới"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Status Summary Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {[
          { key: "ALL", label: "Tất cả", count: counts.total, color: "slate" },
          { key: "PENDING", label: "Cần nhận việc", count: counts.pending, color: "blue" },
          { key: "IN_SURVEY", label: "Đang khảo sát", count: counts.inSurvey, color: "indigo" },
          { key: "IN_PROGRESS", label: "Đang thi công", count: counts.inProgress, color: "amber" },
          { key: "ACCEPTANCE", label: "Chờ nghiệm thu", count: counts.acceptance, color: "teal" },
          { key: "COMPLETED", label: "Hoàn tất", count: counts.completed, color: "emerald" },
          { key: "CANCELLED", label: "Đã hủy", count: counts.cancelled, color: "rose" },
        ].map((tab) => {
          const active = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-2 shadow-2xs ${active
                  ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20"
                  : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
            >
              <span className={`text-[11px] font-bold ${active ? "text-blue-100" : "text-slate-500"}`}>
                {tab.label}
              </span>
              <div className="flex items-center justify-between">
                <span className="text-lg font-black font-mono">{tab.count}</span>
                {tab.count > 0 && (
                  <span
                    className={`w-2 h-2 rounded-full ${active ? "bg-white" : "bg-blue-500"
                      }`}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. Search, District Filter, Sort & View Mode */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-2.5 w-full lg:w-auto flex-1">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Tìm theo mã đơn (#12), địa chỉ, tên khách, thợ..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
              />
              {searchText && (
                <button
                  onClick={() => setSearchText("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="relative sm:w-56">
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition appearance-none cursor-pointer"
              >
                <option value="">Khu vực: Tất cả Hà Nội</option>
                {HANOI_DISTRICTS.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                ▼
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full lg:w-auto justify-between lg:justify-end">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition cursor-pointer"
            >
              <option value="newest">Mới nhất trước</option>
              <option value="oldest">Cũ nhất trước</option>
              <option value="price_desc">Dự toán cao nhất</option>
              <option value="price_asc">Dự toán thấp nhất</option>
            </select>

            <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-xl transition cursor-pointer ${viewMode === "table"
                    ? "bg-white text-blue-700 shadow-xs font-bold"
                    : "text-slate-500 hover:text-slate-800"
                  }`}
                title="Dạng bảng chi tiết"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-xl transition cursor-pointer ${viewMode === "grid"
                    ? "bg-white text-blue-700 shadow-xs font-bold"
                    : "text-slate-500 hover:text-slate-800"
                  }`}
                title="Dạng thẻ lưới"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
          <span>
            Hiển thị <strong>{filteredJobs.length}</strong> / <strong>{jobs.length}</strong> công việc
          </span>
          {(selectedDistrict || searchText || statusFilter !== "ALL") && (
            <button
              onClick={() => {
                setSelectedDistrict("");
                setSearchText("");
                setStatusFilter("ALL");
              }}
              className="text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer"
            >
              Xóa tất cả bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* 4. Jobs List (Table or Grid View) */}
      {filteredJobs.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl text-center text-slate-400 border border-slate-200 shadow-xs space-y-3">
          <ClipboardList className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">
            {jobs.length === 0
              ? "Chưa có công việc khảo sát nào được phân công."
              : "Không tìm thấy công trình nào phù hợp với bộ lọc."}
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Vui lòng kiểm tra lại bộ lọc trạng thái, quận huyện hoặc từ khóa tìm kiếm.
          </p>
        </div>
      ) : viewMode === "table" ? (
        <SurveyJobsTable
          paginatedJobs={paginatedJobs}
          detailsMap={detailsMap}
          openModal={openModal}
          handleAcceptJob={handleAcceptJob}
          handleRejectJob={handleRejectJob}
          handleSupervisorAccept={handleSupervisorAccept}
        />
      ) : (
        <SurveyJobsGrid
          paginatedJobs={paginatedJobs}
          detailsMap={detailsMap}
          openModal={openModal}
          handleAcceptJob={handleAcceptJob}
          handleRejectJob={handleRejectJob}
          handleSupervisorAccept={handleSupervisorAccept}
        />
      )}

      {/* 5. Phân trang Pagination */}
      {filteredJobs.length > itemsPerPage && (
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredJobs.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* ===================== MODALS CHUYÊN BIỆT (SRP) ===================== */}
      {selectedJob && modalType === "view" && (
        <SurveyJobDetailModal
          selectedJob={selectedJob}
          selectedDetail={selectedDetail}
          loadingDetail={loadingDetail}
          viewTab={viewTab}
          setViewTab={setViewTab}
          dailyReports={dailyReports}
          loadingDailyReports={loadingDailyReports}
          contractData={contractData}
          splitImageUrls={splitImageUrls}
          setSelectedPreviewImage={setSelectedPreviewImage}
          closeModal={closeModal}
          onAcceptJob={handleAcceptJob}
          onRejectJob={handleRejectJob}
          onOpenReport={(job) => openModal(job, "report")}
          onOpenDaily={(job) => openModal(job, "daily")}
          onOpenDailyReport={(job) => openModal(job, "daily")}
          onOpenAgreement={(job) => openModal(job, "agreement")}
          onSupervisorAccept={handleSupervisorAccept}
        />
      )}

      {selectedJob && modalType === "report" && (
        <SurveyReportModal
          selectedJob={selectedJob}
          surveyNote={surveyNote}
          setSurveyNote={setSurveyNote}
          materialNote={materialNote}
          setMaterialNote={setMaterialNote}
          surveyPreviewUrls={surveyPreviewUrls}
          handleSelectImages={handleSelectImages}
          removeSurveyPreview={removeSurveyPreview}
          closeModal={closeModal}
          submitting={submitting}
          handleSubmitSurveyReport={handleSubmitSurveyReport}
        />
      )}

      {selectedJob && modalType === "daily" && (
        <SurveyDailyReportModal
          selectedJob={selectedJob}
          dailyContent={dailyContent}
          setDailyContent={setDailyContent}
          dailyProgress={dailyProgress}
          setDailyProgress={setDailyProgress}
          dailyMaterialCost={dailyMaterialCost}
          setDailyMaterialCost={setDailyMaterialCost}
          dailyMaterialShortage={dailyMaterialShortage}
          setDailyMaterialShortage={setDailyMaterialShortage}
          progressPreviewUrls={progressPreviewUrls}
          handleSelectImages={handleSelectImages}
          removeProgressPreview={removeProgressPreview}
          closeModal={closeModal}
          submitting={submitting}
          handleSubmitDailyReport={handleSubmitDailyReport}
        />
      )}

      {selectedJob && modalType === "agreement" && (
        <SurveyAgreementModal
          selectedJob={selectedJob}
          customerAgreed={customerAgreed}
          setCustomerAgreed={setCustomerAgreed}
          contractContent={contractContent}
          setContractContent={setContractContent}
          rejectReason={rejectReason}
          setRejectReason={setRejectReason}
          surveySigCanvasRef={surveySigCanvasRef}
          hasSurveySignature={hasSurveySignature}
          clearSurveySignature={clearSurveySignature}
          closeModal={closeModal}
          submitting={submitting}
          handleSubmitAgreement={handleSubmitAgreement}
        />
      )}

      {/* Lightbox Modal */}
      {selectedPreviewImage && (
        <ImageLightboxModal
          image={selectedPreviewImage}
          onClose={() => setSelectedPreviewImage(null)}
        />
      )}

      {/* Prompt Dialog: Từ chối nhận việc */}
      <PromptDialog
        isOpen={Boolean(promptReject)}
        title="Từ chối nhận việc khảo sát"
        description={`Bạn có chắc chắn muốn từ chối tiếp nhận công trình #${promptReject?.jobId}? Vui lòng nhập lý do từ chối.`}
        placeholder="Ví dụ: Bận lịch khảo sát khác, khu vực quá xa..."
        confirmText="Xác nhận từ chối"
        cancelText="Đóng"
        confirmVariant="danger"
        isLoading={isSubmittingReject}
        onConfirm={submitRejectJob}
        onCancel={() => setPromptReject(null)}
      />

      {/* Confirm Dialog: Nghiệm thu công trình */}
      <ConfirmDialog
        isOpen={Boolean(confirmAcceptance)}
        title="Xác nhận nghiệm thu công trình"
        message={`Bạn có chắc chắn đã kiểm tra hiện trường và đồng ý nghiệm thu hoàn thành công trình #${confirmAcceptance?.jobId}? Sau khi xác nhận, đơn sẽ chờ khách hàng nghiệm thu để quyết toán.`}
        confirmText="Xác nhận nghiệm thu"
        cancelText="Kiểm tra lại"
        variant="primary"
        isLoading={isSubmittingAcceptance}
        onConfirm={submitSupervisorAccept}
        onCancel={() => setConfirmAcceptance(null)}
      />
    </div>
  );
}