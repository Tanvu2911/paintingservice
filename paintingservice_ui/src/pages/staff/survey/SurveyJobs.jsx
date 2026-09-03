import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import {
  RefreshCw,
  Search,
  ClipboardList,
  MapPin,
  Calendar,
  User,
  Wrench,
  FileText,
  AlertTriangle,
  Check,
  X,
  Award,
  Eye,
  FileSignature,
  DollarSign,
  Camera,
  CheckCircle2,
  Clock,
  Layers,
  Upload,
  LayoutGrid,
  List,
  Phone,
  Wallet,
  ShieldCheck,
  ChevronRight,
  Filter,
} from "lucide-react";
import AxiosConfig from "../../../util/AxiosConfig";
import { bookingDetailApi, splitImageUrls } from "../../../util/bookingDetailApi";
import ImageLightboxModal from "../../../components/common/ImageLightboxModal";
import StatusBadge from "../../../components/common/StatusBadge";
import Pagination from "../../../components/common/Pagination";
import { parseHanoiAddress, HANOI_DISTRICTS } from "../../../data/hanoiLocations";
import { formatMoney } from "../../../util/formatters";
import { formatDate } from "../../../util/orderFlowUtils";

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
  const [dailyMaterialCost, setDailyMaterialCost] = useState("");
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
  // COUNTS THEO NHÓM TRẠNG THÁI
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

  // =========================================================
  // FILTER & SORT
  // =========================================================

  const filteredJobs = useMemo(() => {
    let result = [...jobs];

    // 1. Lọc theo tab trạng thái
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

    // 2. Lọc theo Quận/Huyện Hà Nội
    if (selectedDistrict) {
      result = result.filter((j) => {
        const parsed = parseHanoiAddress(j.address || "");
        return parsed.district === selectedDistrict;
      });
    }

    // 3. Tìm kiếm từ khóa
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

    // 4. Sắp xếp
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

  // Reset trang về 1 khi đổi bộ lọc
  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, statusFilter, selectedDistrict, sortOrder]);

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
      !materialNote.trim()
    ) {
      showToast?.("Vui lòng nhập ít nhất nội dung khảo sát hoặc vật liệu", "error");
      return;
    }

    try {
      setSubmitting(true);

      // Bước 1: Lưu báo giá vào Booking qua StaffProfileController
      await AxiosConfig.post(
        `/staff/survey/jobs/${selectedJob.id}/report`,
        {}
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

      // (Đã loại bỏ báo cáo vật liệu phát sinh ở bước khảo sát đầu tiên theo yêu cầu)

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
      SURVEYING: { text: "Đang khảo sát", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
      WAITING_CONTRACT_APPROVAL: { text: "Chờ duyệt HĐ", color: "bg-cyan-100 text-cyan-800 border-cyan-200" },
      WAITING_CUSTOMER_SIGNATURE: { text: "Chờ khách ký HĐ", color: "bg-amber-100 text-amber-800 border-amber-200" },
      CONTRACT_APPROVED: { text: "HĐ đã duyệt", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
      ASSIGNED: { text: "Đã phân công thợ", color: "bg-teal-100 text-teal-800 border-teal-200" },
      PROCESSING: { text: "Đang thi công", color: "bg-orange-100 text-orange-800 border-orange-200" },
      WORKER_COMPLETED: { text: "Thợ hoàn thành", color: "bg-teal-100 text-teal-800 border-teal-200" },
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
      {/* 1. Header & Actions */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
            <h1 className="text-xl font-black text-slate-900">
              Công Việc Khảo Sát &amp; Giám Sát
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tiếp nhận khảo sát, lập báo cáo hiện trường, theo dõi tiến độ thi công và nghiệm thu công trình.
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadJobs(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition cursor-pointer shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-blue-600" : ""}`} />
          <span>Làm mới danh sách</span>
        </button>
      </div>

      {/* 2. KPI Status Filter Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {[
            { key: "ALL", label: "Tất cả", count: counts.total },
            { key: "PENDING", label: "Chờ nhận việc", count: counts.pending },
            { key: "IN_SURVEY", label: "Đang khảo sát / Báo giá", count: counts.inSurvey },
            { key: "IN_PROGRESS", label: "Đang thi công", count: counts.inProgress },
            { key: "ACCEPTANCE", label: "Chờ nghiệm thu", count: counts.acceptance },
            { key: "COMPLETED", label: "Hoàn tất", count: counts.completed },
            { key: "CANCELLED", label: "Đã hủy / Từ chối", count: counts.cancelled },
          ].map((tab) => {
            const active = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  active
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    active
                      ? "bg-white/20 text-white"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Search, District Filter, Sort & View Mode Switcher */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Ô Tìm kiếm */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Tìm theo #Mã đơn, dịch vụ, địa chỉ, khách hàng, thợ..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-medium"
            />
            {searchText && (
              <button
                type="button"
                onClick={() => setSearchText("")}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Bộ lọc Quận/Huyện Hà Nội */}
          <div className="w-full md:w-52">
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            >
              <option value="">Khu vực: Tất cả Hà Nội</option>
              {HANOI_DISTRICTS.map((d) => (
                <option key={d.name} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sắp xếp */}
          <div className="w-full md:w-48">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            >
              <option value="newest">Ngày hẹn mới nhất</option>
              <option value="oldest">Ngày hẹn cũ nhất</option>
              <option value="price_desc">Giá trị cao nhất</option>
              <option value="price_asc">Giá trị thấp nhất</option>
            </select>
          </div>

          {/* View Mode Toggle: Table vs Grid */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 self-end md:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === "table"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Dạng bảng chi tiết"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Bảng</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === "grid"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Dạng thẻ lưới"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Thẻ</span>
            </button>
          </div>
        </div>

        {/* Thống kê kết quả lọc */}
        <div className="flex justify-between items-center text-xs text-slate-500 pt-1">
          <span>
            Tìm thấy <strong>{filteredJobs.length}</strong> / {jobs.length} công trình phù hợp
          </span>
          {(selectedDistrict || searchText || statusFilter !== "ALL") && (
            <button
              type="button"
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
        /* TABLE VIEW (Chuẩn như trang Admin) */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-slate-400 uppercase text-[10px] font-black tracking-wider border-b border-slate-100">
                  <th className="py-3.5 px-5">Đơn hàng &amp; Dịch vụ</th>
                  <th className="py-3.5 px-5">Khách hàng</th>
                  <th className="py-3.5 px-5">Công trình &amp; Khu vực</th>
                  <th className="py-3.5 px-5">Dự toán &amp; Thù lao</th>
                  <th className="py-3.5 px-5">Trạng thái</th>
                  <th className="py-3.5 px-5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedJobs.map((job) => {
                  const detail = detailsMap[job.id] || null;
                  const status = job.status || "PENDING";
                  const canAccept = ["PENDING", "SURVEY_ASSIGNED"].includes(status);
                  const canReport = ["ACCEPTED", "SURVEYING"].includes(status);
                  const hasSurveyReport = Boolean(
                    detail?.surveyNote || detail?.materialNote || detail?.materialShortage
                  );
                  const canDailyReport = ["CONTRACT_APPROVED", "ASSIGNED", "PROCESSING"].includes(status);
                  const canSupervisorAccept =
                    status === "WORKER_COMPLETED" && (!detail || !detail.supervisorAccepted);
                  const hasTeam = job.technicianName || job.preferredTechnicianName;
                  const parsed = parseHanoiAddress(job.address);
                  const supervisorPayout = Number(job.totalAmount) > 0 ? Number(job.totalAmount) * 0.10 : Number(job.surveyFee) || 200000;

                  return (
                    <tr
                      key={job.id}
                      className="hover:bg-slate-50/80 transition group cursor-pointer"
                      onClick={() => openModal(job, "view")}
                    >
                      {/* 1. Mã đơn & Dịch vụ */}
                      <td className="py-3.5 px-5 align-top">
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className="font-mono text-blue-600 group-hover:text-blue-800 transition">
                            #{job.id}
                          </span>
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-800 truncate max-w-[150px]">
                            {job.serviceName || "Khảo sát sơn"}
                          </span>
                        </div>
                        <div className="text-[10.5px] text-slate-400 mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>
                            {job.appointmentDate ? formatDate(job.appointmentDate) : "Chưa đặt lịch hẹn"}
                          </span>
                        </div>
                        {hasSurveyReport && (
                          <div className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded mt-1 border border-indigo-200">
                            <FileText className="w-2.5 h-2.5" />
                            <span>Đã có báo cáo KS</span>
                          </div>
                        )}
                      </td>

                      {/* 2. Khách hàng */}
                      <td className="py-3.5 px-5 align-top">
                        <div className="font-bold text-slate-900 truncate">
                          {job.customerName || "Khách hàng"}
                        </div>
                        {job.customerPhone ? (
                          <a
                            href={`tel:${job.customerPhone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-[11px] text-slate-500 hover:text-blue-600 flex items-center gap-1 mt-0.5"
                          >
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{job.customerPhone}</span>
                          </a>
                        ) : (
                          <span className="text-[11px] text-slate-400">—</span>
                        )}
                      </td>

                      {/* 3. Công trình & Khu vực */}
                      <td className="py-3.5 px-5 align-top max-w-xs">
                        <div className="text-slate-700 font-medium text-xs truncate" title={job.address}>
                          {job.address || "Địa chỉ công trình"}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {parsed.district && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                              <MapPin className="w-2.5 h-2.5 text-blue-600" />
                              <span>{parsed.district}</span>
                            </span>
                          )}
                          <span className="text-[10px] text-slate-500">
                            Thợ: <strong className={hasTeam ? "text-emerald-900" : "text-slate-400"}>{hasTeam ? `@${hasTeam}` : "Chưa gán"}</strong>
                          </span>
                        </div>
                      </td>

                      {/* 4. Dự toán & Thù lao */}
                      <td className="py-3.5 px-5 align-top">
                        <div className="font-black text-slate-900 text-xs">
                          {Number(job.totalAmount) > 0 ? (
                            <span className="font-mono text-slate-900">{formatMoney(job.totalAmount)}</span>
                          ) : (
                            <span className="text-slate-400 italic font-normal text-[11px]">Chưa báo giá</span>
                          )}
                        </div>
                        <div className="text-[10.5px] text-emerald-700 font-mono mt-0.5 flex items-center gap-1">
                          <Wallet className="w-3 h-3 text-emerald-600" />
                          <span>Thù lao (10%): <strong>{formatMoney(supervisorPayout)}</strong></span>
                        </div>
                      </td>

                      {/* 5. Trạng thái */}
                      <td className="py-3.5 px-5 align-top">
                        <StatusBadge status={status} />
                      </td>

                      {/* 6. Thao tác */}
                      <td className="py-3.5 px-5 align-top text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {canAccept && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleAcceptJob(job.id)}
                                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-xs cursor-pointer flex items-center gap-1 text-xs"
                                title="Nhận việc khảo sát"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Nhận việc</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRejectJob(job.id)}
                                className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold transition cursor-pointer"
                                title="Từ chối"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {canReport && (
                            <button
                              type="button"
                              onClick={() => openModal(job, "report")}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition shadow-xs cursor-pointer flex items-center gap-1 text-xs"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Báo cáo KS</span>
                            </button>
                          )}

                          {canDailyReport && (
                            <button
                              type="button"
                              onClick={() => openModal(job, "daily")}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition shadow-xs cursor-pointer flex items-center gap-1 text-xs"
                            >
                              <Calendar className="w-3.5 h-3.5" />
                              <span>Nhật ký</span>
                            </button>
                          )}

                          {canSupervisorAccept && (
                            <button
                              type="button"
                              onClick={() => handleSupervisorAccept(job.id)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition shadow-xs cursor-pointer flex items-center gap-1 text-xs"
                            >
                              <Award className="w-3.5 h-3.5" />
                              <span>Nghiệm thu</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => openModal(job, "view")}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 transition cursor-pointer shadow-xs flex items-center gap-1 text-xs"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>Chi tiết</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID VIEW (Dạng thẻ) */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paginatedJobs.map((job) => {
            const detail = detailsMap[job.id] || null;
            const status = job.status || "PENDING";
            const canAccept = ["PENDING", "SURVEY_ASSIGNED"].includes(status);
            const canReport = ["ACCEPTED", "SURVEYING"].includes(status);
            const hasSurveyReport = Boolean(
              detail?.surveyNote || detail?.materialNote || detail?.materialShortage
            );
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
                className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-all duration-200 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200 text-xs">
                          #{job.id}
                        </span>
                        <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                          {job.serviceName || "Dịch vụ sơn sửa"}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-base mt-2 line-clamp-1">
                        {job.serviceName || `Công trình #${job.id}`}
                      </h3>
                    </div>
                    <StatusBadge status={status} />
                  </div>

                  <div className="space-y-2 text-xs bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <p className="text-slate-800 font-semibold leading-relaxed">
                        {job.address || "Chưa có địa chỉ"}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2 text-slate-600">
                      <div className="flex items-center gap-1.5 truncate">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Khách: <strong className="text-slate-900">{job.customerName || "Khách hàng"}</strong></span>
                      </div>
                      {job.customerPhone && (
                        <a
                          href={`tel:${job.customerPhone}`}
                          className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 shrink-0 flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Phone className="w-3 h-3" />
                          <span>{job.customerPhone}</span>
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Hẹn: <strong>{job.appointmentDate ? new Date(job.appointmentDate).toLocaleString("vi-VN") : "Chưa đặt"}</strong></span>
                    </div>

                    {hasQuote && (
                      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Báo giá:</span>
                        <span className="font-black text-slate-900">{formatMoney(job.totalAmount)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Grid Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                  {canAccept && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleAcceptJob(job.id)}
                        className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Nhận việc</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRejectJob(job.id)}
                        className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}

                  {canReport && (
                    <button
                      type="button"
                      onClick={() => openModal(job, "report")}
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Báo cáo khảo sát</span>
                    </button>
                  )}

                  {canDailyReport && (
                    <button
                      type="button"
                      onClick={() => openModal(job, "daily")}
                      className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Nhật ký ngày</span>
                    </button>
                  )}

                  {canSupervisorAccept && (
                    <button
                      type="button"
                      onClick={() => handleSupervisorAccept(job.id)}
                      className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>Nghiệm thu</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => openModal(job, "view")}
                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Chi tiết</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
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
                      { key: "overview", label: "Tổng quan" },
                      { key: "survey", label: "Khảo sát & Vật tư" },
                      { key: "daily", label: `Tiến độ ngày (${dailyReports.length})` },
                      { key: "contract", label: "Hợp đồng" },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setViewTab(tab.key)}
                        className={`pb-3 px-3 text-xs font-bold border-b-2 transition cursor-pointer ${
                          viewTab === tab.key
                            ? "border-slate-900 text-slate-900"
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
                          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-500" />
                            <span>Thông tin khách hàng &amp; Công trình</span>
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
                          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                            <DollarSign className="w-3.5 h-3.5 text-slate-500" />
                            <span>Tài chính &amp; Báo giá</span>
                          </h4>
                          <div className="text-xs space-y-1.5 text-slate-600">
                            <p><strong>Tổng báo giá:</strong> <span className="font-bold text-slate-900 text-sm">{formatMoney(selectedJob.totalAmount)}</span></p>
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
                        <h4 className="font-bold text-emerald-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                          <Wrench className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Đội ngũ thi công &amp; Giám sát</span>
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-emerald-800">
                          <p><strong>Thợ phụ trách:</strong> {selectedJob.technicianName || selectedJob.preferredTechnicianName || "Chưa phân công"}</p>
                          <p><strong>Số điện thoại thợ:</strong> {selectedJob.technicianPhone || "—"}</p>
                        </div>
                      </div>

                      {/* Acceptance Status */}
                      <div className="bg-teal-50 border border-teal-100 p-4 rounded-2xl space-y-2">
                        <h4 className="font-bold text-teal-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-teal-700" />
                          <span>Trạng thái nghiệm thu</span>
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div className="flex items-center gap-2">
                            <span>Giám sát:</span>
                            {selectedDetail?.supervisorAccepted ? (
                              <span className="font-bold text-emerald-600">Đã nghiệm thu</span>
                            ) : (
                              <span className="text-amber-600 font-medium">Chưa nghiệm thu</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span>Khách hàng:</span>
                            {selectedDetail?.customerAccepted ? (
                              <span className="font-bold text-emerald-600">Đã nghiệm thu</span>
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
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            <span>Phát sinh thiếu vật tư / vật liệu cần bổ sung:</span>
                          </label>
                          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 whitespace-pre-wrap">
                            {selectedDetail.materialShortage}
                          </div>
                        </div>
                      )}

                      {/* Survey Images */}
                      {splitImageUrls(selectedDetail?.surveyImages).length > 0 && (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                            <Camera className="w-3.5 h-3.5 text-slate-500" />
                            <span>Ảnh chụp khảo sát hiện trường:</span>
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
                                  <span>Xem ảnh</span>
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
                                  <div className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                    <span className="font-bold text-slate-800 text-xs">
                                      Báo cáo ngày {dailyReports.length - index}
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
                                        <span className="font-bold text-amber-600">{report.progressPercentage}%</span>
                                      </div>
                                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                          className="h-full bg-amber-500 rounded-full"
                                          style={{ width: `${Math.min(100, Math.max(0, report.progressPercentage))}%` }}
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {report.materialShortage && (
                                    <div className="bg-amber-50 p-2.5 rounded-xl text-xs text-amber-800 border border-amber-200 flex items-start gap-1.5">
                                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                      <div>
                                        <strong>Phát sinh:</strong> {report.materialShortage}
                                      </div>
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
                                  Đã ký hợp đồng
                                </span>
                              ) : (
                                <span className="px-3 py-1 bg-amber-100 text-amber-800 font-bold rounded-full">
                                  Chờ khách ký
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
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
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
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-slate-500" />
                      <span>Ảnh chụp khảo sát hiện trường</span>
                    </label>
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition">
                      <Camera className="w-6 h-6 text-slate-400 mb-1" />
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
                              <X className="w-3 h-3 text-white" />
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
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Tiến độ hoàn thành (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={dailyProgress}
                        onChange={(e) => setDailyProgress(e.target.value)}
                        placeholder="Ví dụ: 45"
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-amber-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Tiền vật liệu phát sinh (VNĐ)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="10000"
                        value={dailyMaterialCost}
                        onChange={(e) => setDailyMaterialCost(e.target.value)}
                        placeholder="Ví dụ: 350000"
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold text-slate-800"
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
                        placeholder="Ví dụ: 1 thùng sơn lót, băng keo"
                        className="w-full border border-amber-200 rounded-xl px-3 py-2 text-xs bg-amber-50/40"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-slate-500" />
                      <span>Ảnh tiến độ thi công hôm nay</span>
                    </label>
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer hover:border-amber-400 hover:bg-amber-50/40 transition">
                      <Camera className="w-6 h-6 text-slate-400 mb-1" />
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
                              <X className="w-3 h-3 text-white" />
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
                            ? "border-blue-600 bg-blue-600 text-white shadow-xs"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <Check className="w-4 h-4" />
                        <span>Khách đồng ý làm</span>
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
                        <X className="w-4 h-4" />
                        <span>Khách không đồng ý</span>
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
                          className="w-full border border-slate-200 rounded-xl p-3 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
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
                            className="text-xs text-rose-600 hover:underline font-bold cursor-pointer"
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
                            <span className="text-emerald-600 font-bold">Đã ký tên xác nhận</span>
                          ) : (
                            <span className="text-amber-600 font-semibold">Vui lòng ký tên vào khung trước khi gửi hợp đồng</span>
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
      <ImageLightboxModal
        imageUrl={selectedPreviewImage}
        onClose={() => setSelectedPreviewImage(null)}
      />
    </div>
  );
}