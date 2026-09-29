import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import AxiosConfig from "../../../util/AxiosConfig";
import Modal from "../../../components/common/Modal";
import LoadingSpinner from "../../../components/common/LoadingSpinner";
import ImageLightboxModal from "../../../components/common/ImageLightboxModal";
import Pagination from "../../../components/common/Pagination";
import { formatMoney } from "../../../util/formatters";
import { HANOI_DISTRICTS, parseHanoiAddress } from "../../../data/hanoiLocations";
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  CheckCircle2,
  Clock,
  Wrench,
  XCircle,
  AlertTriangle,
  User,
  Phone,
  Calendar,
  MapPin,
  Image,
  ClipboardCheck,
  Package,
  Send,
  RefreshCw,
  Eye,
  Camera,
  Trash2,
  Play,
  FileText,
  DollarSign,
  Award,
  Sparkles,
  ExternalLink,
  Layers,
  Wallet,
  LayoutGrid,
  List,
  Check,
  X,
  UserCheck,
  AlertCircle,
} from "lucide-react";

export default function StaffWarrantyJobs({ role = "survey" }) {
  const { user, showToast } = useOutletContext() || {};
  const isSurveyor = role === "survey";

  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search, Filter & Sort
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'table'

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Lightbox
  const [previewImage, setPreviewImage] = useState(null);

  // Detail Modal State
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [detailTab, setDetailTab] = useState("overview"); // 'overview' | 'survey_result' | 'completion'

  // Modal 1: Giám sát nộp Báo cáo khảo sát
  const [reportModalClaim, setReportModalClaim] = useState(null);
  const [faultType, setFaultType] = useState("COMPANY_FAULT"); // COMPANY_FAULT | CUSTOMER_FAULT
  const [surveyNote, setSurveyNote] = useState("");
  const [materialNote, setMaterialNote] = useState("");
  const [suggestedPrice, setSuggestedPrice] = useState("");
  const [surveyFiles, setSurveyFiles] = useState([]);
  const [surveyFilePreviews, setSurveyFilePreviews] = useState([]);
  const [submittingReport, setSubmittingReport] = useState(false);

  // Modal 2: Giám sát nghiệm thu hiện trường cùng khách hàng
  const [supervisorAcceptClaim, setSupervisorAcceptClaim] = useState(null);
  const [supervisorNote, setSupervisorNote] = useState("");
  const [resolvedFiles, setResolvedFiles] = useState([]);
  const [resolvedFilePreviews, setResolvedFilePreviews] = useState([]);
  const [submittingAccept, setSubmittingAccept] = useState(false);

  // Modal 3: Thợ xác nhận báo hoàn thành
  const [workerCompleteClaim, setWorkerCompleteClaim] = useState(null);
  const [submittingWorkerComplete, setSubmittingWorkerComplete] = useState(false);

  // Modal 4: Thợ từ chối nhận việc
  const [rejectJobClaim, setRejectJobClaim] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [submittingRejectJob, setSubmittingRejectJob] = useState(false);

  // Modal 5: Giám sát từ chối nhận việc
  const [rejectSupervisorClaim, setRejectSupervisorClaim] = useState(null);
  const [rejectSupervisorReason, setRejectSupervisorReason] = useState("");
  const [submittingRejectSupervisor, setSubmittingRejectSupervisor] = useState(false);

  const fetchClaims = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const endpoint = isSurveyor
        ? "/warranty-claims/surveyor/my-claims"
        : "/warranty-claims/technician/my-claims";

      const res = await AxiosConfig.get(endpoint);
      setClaims(Array.isArray(res.data) ? res.data : []);
      if (isRefresh) showToast?.("Đã làm mới danh sách bảo hành!", "success");
    } catch (err) {
      console.error("Lỗi tải danh sách bảo hành:", err);
      showToast?.("Không thể tải danh sách phiếu bảo hành!", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isSurveyor, showToast]);

  useEffect(() => {
    fetchClaims(false);
  }, [fetchClaims]);

  const handleRefresh = () => fetchClaims(true);

  // Tính thù lao hiển thị thông minh cho Nhân sự
  const getExpectedPayout = useCallback(
    (c) => {
      if (!c) return 0;
      const supportPrice = Number(c.finalSupportPrice) || Number(c.suggestedPrice) || 0;
      const isCustomerFault = c.faultType === "CUSTOMER_FAULT" || supportPrice > 0;
      if (isSurveyor) {
        if (c.surveyorSalary != null) return Number(c.surveyorSalary);
        return isCustomerFault ? (supportPrice > 0 ? Math.round(supportPrice * 0.10) : 100000) : 100000;
      } else {
        if (c.workerSalary != null) return Number(c.workerSalary);
        const isOldWorker = Boolean(
          c.technicianId &&
          c.previousTechnicianId &&
          String(c.technicianId) === String(c.previousTechnicianId)
        );
        if (isCustomerFault) return supportPrice > 0 ? Math.round(supportPrice * 0.60) : 200000;
        if (isOldWorker) return 0;
        return 200000;
      }
    },
    [isSurveyor]
  );

  // =========================================================
  // ACTIONS: GIÁM SÁT
  // =========================================================
  const openReportModal = (claim) => {
    setReportModalClaim(claim);
    setFaultType(claim.faultType || "COMPANY_FAULT");
    setSurveyNote(claim.surveyNote || "");
    setMaterialNote(claim.materialNote || "");
    setSuggestedPrice(claim.suggestedPrice ? String(claim.suggestedPrice) : "");
    setSurveyFiles([]);
    setSurveyFilePreviews([]);
  };

  const handleSurveyFilesChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length + surveyFiles.length > 6) {
      showToast?.("Tối đa chỉ chọn 6 ảnh khảo sát!", "warning");
      return;
    }
    const newFiles = [...surveyFiles, ...files];
    setSurveyFiles(newFiles);
    setSurveyFilePreviews(newFiles.map((f) => URL.createObjectURL(f)));
  };

  const handleRemoveSurveyFile = (index) => {
    const newFiles = surveyFiles.filter((_, i) => i !== index);
    setSurveyFiles(newFiles);
    setSurveyFilePreviews(newFiles.map((f) => URL.createObjectURL(f)));
  };

  const handleSubmitSurveyReport = async (e) => {
    e.preventDefault();
    if (!reportModalClaim) return;
    if (!surveyNote.trim()) {
      showToast?.("Vui lòng nhập ghi chú hiện trạng kiểm tra!", "warning");
      return;
    }

    setSubmittingReport(true);
    try {
      const formData = new FormData();
      formData.append("faultType", faultType);
      formData.append("surveyNote", surveyNote.trim());
      formData.append("materialNote", materialNote.trim());
      if (faultType === "CUSTOMER_FAULT" && suggestedPrice) {
        formData.append("suggestedPrice", Number(suggestedPrice) || 0);
      }
      surveyFiles.forEach((file) => formData.append("files", file));

      await AxiosConfig.post(
        `/warranty-claims/${reportModalClaim.id}/survey-report`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      showToast?.("Đã gửi báo cáo khảo sát thẩm định thành công!", "success");
      setReportModalClaim(null);
      if (selectedClaim?.id === reportModalClaim.id) setSelectedClaim(null);
      fetchClaims(false);
    } catch (err) {
      showToast?.(err.response?.data?.message || "Lỗi khi gửi báo cáo!", "error");
    } finally {
      setSubmittingReport(false);
    }
  };

  const openSupervisorAcceptModal = (claim) => {
    setSupervisorAcceptClaim(claim);
    setSupervisorNote(claim.supervisorNote || "");
    setResolvedFiles([]);
    setResolvedFilePreviews([]);
  };

  const handleResolvedFilesChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length + resolvedFiles.length > 6) {
      showToast?.("Tối đa chỉ chọn 6 ảnh nghiệm thu!", "warning");
      return;
    }
    const newFiles = [...resolvedFiles, ...files];
    setResolvedFiles(newFiles);
    setResolvedFilePreviews(newFiles.map((f) => URL.createObjectURL(f)));
  };

  const handleRemoveResolvedFile = (index) => {
    const newFiles = resolvedFiles.filter((_, i) => i !== index);
    setResolvedFiles(newFiles);
    setResolvedFilePreviews(newFiles.map((f) => URL.createObjectURL(f)));
  };

  const handleSubmitSupervisorAccept = async (e) => {
    e.preventDefault();
    if (!supervisorAcceptClaim) return;
    if (resolvedFiles.length === 0) {
      showToast?.("Vui lòng chụp và tải lên ít nhất 1 ảnh nghiệm thu hoàn tất!", "warning");
      return;
    }

    setSubmittingAccept(true);
    try {
      const formData = new FormData();
      formData.append("note", supervisorNote.trim());
      formData.append("supervisorNote", supervisorNote.trim());
      resolvedFiles.forEach((file) => formData.append("files", file));

      await AxiosConfig.post(
        `/warranty-claims/${supervisorAcceptClaim.id}/supervisor-accept`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      showToast?.("Đã hoàn tất nghiệm thu hiện trường cùng khách hàng!", "success");
      setSupervisorAcceptClaim(null);
      if (selectedClaim?.id === supervisorAcceptClaim.id) setSelectedClaim(null);
      fetchClaims(false);
    } catch (err) {
      showToast?.(err.response?.data?.message || "Lỗi khi nghiệm thu!", "error");
    } finally {
      setSubmittingAccept(false);
    }
  };

  const handleSupervisorAcceptJob = async (claim) => {
    try {
      await AxiosConfig.post(`/warranty-claims/${claim.id}/surveyor-accept`);
      showToast?.("Đã tiếp nhận nhiệm vụ khảo sát bảo hành!", "success");
      if (selectedClaim?.id === claim.id) setSelectedClaim(null);
      fetchClaims(false);
    } catch (err) {
      showToast?.(err.response?.data?.message || "Tiếp nhận nhiệm vụ thất bại!", "error");
    }
  };

  const openSupervisorRejectModal = (claim) => {
    setRejectSupervisorClaim(claim);
    setRejectSupervisorReason("");
  };

  const handleConfirmSupervisorReject = async (e) => {
    e.preventDefault();
    if (!rejectSupervisorClaim) return;
    if (!rejectSupervisorReason.trim()) {
      showToast?.("Vui lòng nhập lý do từ chối nhận việc!", "warning");
      return;
    }
    setSubmittingRejectSupervisor(true);
    try {
      await AxiosConfig.post(`/warranty-claims/${rejectSupervisorClaim.id}/surveyor-reject`, {
        reason: rejectSupervisorReason.trim(),
      });
      showToast?.("Đã từ chối nhận việc! Hệ thống đã thông báo đến Ban Quản Trị để phân công Giám sát khác.", "info");
      setRejectSupervisorClaim(null);
      if (selectedClaim?.id === rejectSupervisorClaim.id) setSelectedClaim(null);
      fetchClaims(false);
    } catch (err) {
      showToast?.(err.response?.data?.message || "Thao tác thất bại!", "error");
    } finally {
      setSubmittingRejectSupervisor(false);
    }
  };

  // =========================================================
  // ACTIONS: THỢ THI CÔNG
  // =========================================================
  const handleStartRepair = async (claim) => {
    try {
      await AxiosConfig.post(`/warranty-claims/${claim.id}/worker-start`);
      showToast?.("Đã xác nhận bắt đầu thi công khắc phục sự cố!", "success");
      if (selectedClaim?.id === claim.id) setSelectedClaim(null);
      fetchClaims(false);
    } catch (err) {
      showToast?.(err.response?.data?.message || "Thao tác thất bại!", "error");
    }
  };

  const handleConfirmWorkerComplete = async () => {
    if (!workerCompleteClaim) return;
    setSubmittingWorkerComplete(true);
    try {
      await AxiosConfig.post(`/warranty-claims/${workerCompleteClaim.id}/worker-complete`);
      showToast?.("Đã báo hoàn thành thi công! Hệ thống đã thông báo đến Giám sát để đến nghiệm thu.", "success");
      setWorkerCompleteClaim(null);
      if (selectedClaim?.id === workerCompleteClaim.id) setSelectedClaim(null);
      fetchClaims(false);
    } catch (err) {
      showToast?.(err.response?.data?.message || "Thao tác thất bại!", "error");
    } finally {
      setSubmittingWorkerComplete(false);
    }
  };

  const handleConfirmTechnicianReject = async (e) => {
    e.preventDefault();
    if (!rejectJobClaim) return;
    if (!rejectReason.trim()) {
      showToast?.("Vui lòng nhập lý do từ chối nhận việc!", "warning");
      return;
    }
    setSubmittingRejectJob(true);
    try {
      await AxiosConfig.post(`/warranty-claims/${rejectJobClaim.id}/technician-reject`, {
        reason: rejectReason.trim(),
      });
      showToast?.("Đã từ chối nhận việc! Hệ thống đã thông báo đến Ban Quản Trị để phân thợ khác.", "info");
      setRejectJobClaim(null);
      if (selectedClaim?.id === rejectJobClaim.id) setSelectedClaim(null);
      fetchClaims(false);
    } catch (err) {
      showToast?.(err.response?.data?.message || "Từ chối việc thất bại!", "error");
    } finally {
      setSubmittingRejectJob(false);
    }
  };

  // =========================================================
  // STATUS BADGE HELPER
  // =========================================================
  const getStatusBadge = (status) => {
    switch (status) {
      case "PENDING":
        return {
          label: "Chờ Tiếp Nhận",
          color: "bg-amber-50 text-amber-800 border-amber-200",
          icon: <Clock className="w-3.5 h-3.5 text-amber-600" />,
        };
      case "SURVEY_ASSIGNED":
        return {
          label: isSurveyor ? "Chờ Bạn Tiếp Nhận" : "Đang Khảo Sát",
          color: "bg-amber-50 text-amber-800 border-amber-200",
          icon: <Clock className="w-3.5 h-3.5 text-amber-600" />,
        };
      case "SURVEYOR_ACCEPTED":
        return {
          label: isSurveyor ? "Đã Tiếp Nhận (Cần Khảo Sát)" : "Giám Sát Đang Khảo Sát",
          color: "bg-blue-50 text-blue-800 border-blue-200",
          icon: <UserCheck className="w-3.5 h-3.5 text-blue-600" />,
        };
      case "SURVEYOR_REJECTED":
        return {
          label: isSurveyor ? "Đã Từ Chối Nhận Việc" : "Chờ Đổi Giám Sát",
          color: "bg-rose-50 text-rose-800 border-rose-200",
          icon: <XCircle className="w-3.5 h-3.5 text-rose-600" />,
        };
      case "SURVEYED":
        return {
          label: "Đã Nộp Báo Cáo (Chờ Admin)",
          color: "bg-indigo-50 text-indigo-800 border-indigo-200",
          icon: <ClipboardCheck className="w-3.5 h-3.5 text-indigo-600" />,
        };
      case "CUSTOMER_ACCEPTED_SUPPORT":
        return {
          label: "Khách Đã Đồng Ý Hỗ Trợ",
          color: "bg-purple-50 text-purple-800 border-purple-200",
          icon: <Sparkles className="w-3.5 h-3.5 text-purple-600" />,
        };
      case "ACCEPTED":
        return {
          label: isSurveyor ? "Đã Gán Thợ Khắc Phục" : "Được Giao Khắc Phục",
          color: "bg-teal-50 text-teal-800 border-teal-200",
          icon: <Wrench className="w-3.5 h-3.5 text-teal-600" />,
        };
      case "IN_PROGRESS":
        return {
          label: "Đang Thi Công Khắc Phục",
          color: "bg-sky-50 text-sky-800 border-sky-200",
          icon: <Wrench className="w-3.5 h-3.5 text-sky-600" />,
        };
      case "WORKER_COMPLETED":
        return {
          label: isSurveyor ? "⚡ Cần Nghiệm Thu Cùng Khách" : "Đã Báo Hoàn Thành (Chờ Nghiệm Thu)",
          color: "bg-orange-50 text-orange-800 border-orange-200",
          icon: <Clock className="w-3.5 h-3.5 text-orange-600" />,
        };
      case "COMPLETED":
        return {
          label: "Đã Hoàn Tất Nghiệm Thu",
          color: "bg-emerald-50 text-emerald-800 border-emerald-200",
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
        };
      case "REJECTED":
        return {
          label: "Từ Chối / Báo Giá Hỗ Trợ",
          color: "bg-rose-50 text-rose-800 border-rose-200",
          icon: <XCircle className="w-3.5 h-3.5 text-rose-600" />,
        };
      case "CANCELLED":
        return {
          label: "Khách Từ Chối Hỗ Trợ (Đã Đóng)",
          color: "bg-slate-100 text-slate-600 border-slate-200",
          icon: <XCircle className="w-3.5 h-3.5 text-slate-500" />,
        };
      default:
        return {
          label: status,
          color: "bg-slate-100 text-slate-700 border-slate-200",
          icon: <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />,
        };
    }
  };

  const parseImages = (imgsStr) => {
    if (!imgsStr) return [];
    return imgsStr.split(",").map((s) => s.trim()).filter(Boolean);
  };

  // =========================================================
  // FILTER & SORT
  // =========================================================
  const filteredClaims = useMemo(() => {
    let result = [...claims];

    // Status filter
    if (statusFilter !== "ALL") {
      result = result.filter((claim) => claim.status === statusFilter);
    }

    // Hanoi District
    if (selectedDistrict) {
      result = result.filter((claim) => {
        const parsed = parseHanoiAddress(claim.address || "");
        return parsed.district === selectedDistrict;
      });
    }

    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(
        (claim) =>
          String(claim.bookingId || "").includes(q) ||
          String(claim.id || "").includes(q) ||
          (claim.customerName || "").toLowerCase().includes(q) ||
          (claim.customerPhone || "").includes(q) ||
          (claim.address || "").toLowerCase().includes(q) ||
          (claim.description || "").toLowerCase().includes(q) ||
          (claim.issueTitle || "").toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortOrder === "newest") {
        const dateA = new Date(a.preferredDate || a.createdAt || 0).getTime();
        const dateB = new Date(b.preferredDate || b.createdAt || 0).getTime();
        return dateB - dateA;
      }
      if (sortOrder === "oldest") {
        const dateA = new Date(a.preferredDate || a.createdAt || 0).getTime();
        const dateB = new Date(b.preferredDate || b.createdAt || 0).getTime();
        return dateA - dateB;
      }
      return Number(b.id) - Number(a.id);
    });

    return result;
  }, [claims, searchTerm, statusFilter, selectedDistrict, sortOrder]);

  const totalPages = Math.ceil(filteredClaims.length / itemsPerPage) || 1;
  const paginatedClaims = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredClaims.slice(start, start + itemsPerPage);
  }, [filteredClaims, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, selectedDistrict, sortOrder]);

  // Counts for tabs
  const counts = useMemo(() => {
    const total = claims.length;
    const pending = claims.filter((c) =>
      ["PENDING", "SURVEY_ASSIGNED", "SURVEYOR_ACCEPTED", "ACCEPTED"].includes(c.status)
    ).length;
    const inProgress = claims.filter((c) => c.status === "IN_PROGRESS").length;
    const waitingAccept = claims.filter((c) => c.status === "WORKER_COMPLETED").length;
    const completed = claims.filter((c) => c.status === "COMPLETED").length;
    const cancelled = claims.filter((c) =>
      ["REJECTED", "CANCELLED"].includes(c.status)
    ).length;

    return { total, pending, inProgress, waitingAccept, completed, cancelled };
  }, [claims]);

  const openClaimDetail = (claim) => {
    setSelectedClaim(claim);
    setDetailTab("overview");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-lg border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {isSurveyor
                ? "Nhiệm Vụ Khảo Sát & Nghiệm Thu Bảo Hành"
                : "Danh Sách Yêu Cầu Bảo Hành & Khắc Phục"}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isSurveyor
              ? "Tiếp nhận thẩm định nguyên nhân, chuẩn bị vật tư và đến hiện trường nghiệm thu cùng khách hàng."
              : "Tiếp nhận công việc bảo hành, thi công khắc phục theo vật tư Giám sát chuẩn bị và báo hoàn thành để nhận thù lao."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-900 font-semibold rounded-lg text-xs transition flex items-center gap-2 cursor-pointer border border-slate-200 shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 text-slate-900 ${refreshing ? "animate-spin" : ""}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Filter Tabs */}
      <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-xs overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {[
            { key: "ALL", label: "Tất cả phiếu", count: counts.total },
            {
              key: isSurveyor ? "SURVEY_ASSIGNED" : "ACCEPTED",
              label: isSurveyor ? "Cần khảo sát" : "Được giao khắc phục",
              count: counts.pending,
            },
            { key: "IN_PROGRESS", label: "Đang thi công", count: counts.inProgress },
            {
              key: "WORKER_COMPLETED",
              label: isSurveyor ? "⚡ Cần nghiệm thu" : "Chờ nghiệm thu",
              count: counts.waitingAccept,
            },
            { key: "COMPLETED", label: "Hoàn tất 100%", count: counts.completed },
            { key: "REJECTED", label: "Từ chối / Hủy", count: counts.cancelled },
          ].map((tab) => {
            const active = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${active
                  ? isSurveyor
                    ? "bg-blue-600 text-white shadow-xs font-bold"
                    : "bg-emerald-600 text-white shadow-xs font-bold"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${active
                    ? "bg-white/25 text-white"
                    : "bg-slate-100 text-slate-600"
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
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Ô Tìm kiếm */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo Phiếu #ID, Đơn #bookingId, KH, SĐT, Địa chỉ, Tiêu đề sự cố..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition font-medium text-slate-900"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-2 text-slate-500 hover:text-slate-900 cursor-pointer"
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
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
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
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            >
              <option value="newest">Ngày hẹn mới nhất</option>
              <option value="oldest">Ngày hẹn cũ nhất</option>
            </select>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200 self-end md:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${viewMode === "grid"
                ? "bg-white text-slate-900 shadow-xs font-bold"
                : "text-slate-500 hover:text-slate-900"
                }`}
              title="Dạng thẻ gọn gàng"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Dạng thẻ</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-md text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${viewMode === "table"
                ? "bg-white text-slate-900 shadow-xs font-bold"
                : "text-slate-500 hover:text-slate-900"
                }`}
              title="Dạng bảng chi tiết"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Bảng</span>
            </button>
          </div>
        </div>

        {/* Thống kê kết quả lọc */}
        <div className="flex justify-between items-center text-xs text-slate-500 pt-1">
          <span>
            Hiển thị <strong>{filteredClaims.length}</strong> / {claims.length} phiếu bảo hành
          </span>
          {(selectedDistrict || searchTerm || statusFilter !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setSelectedDistrict("");
                setSearchTerm("");
                setStatusFilter("ALL");
              }}
              className="text-slate-900 hover:underline font-semibold cursor-pointer"
            >
              Xóa tất cả bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* 4. Claims List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-medium text-slate-500">
            Đang tải danh sách nhiệm vụ bảo hành...
          </p>
        </div>
      ) : filteredClaims.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 bg-slate-50 text-slate-900 rounded-lg flex items-center justify-center mx-auto border border-slate-200">
            <ShieldCheck className="w-6 h-6 text-slate-900" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">
            {claims.length === 0
              ? isSurveyor
                ? "Bạn chưa có nhiệm vụ khảo sát / nghiệm thu bảo hành nào"
                : "Bạn chưa có công việc khắc phục bảo hành nào"
              : "Không có phiếu bảo hành nào phù hợp bộ lọc"}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Khi Ban Quản Trị phân công nhiệm vụ bảo hành mới cho bạn, thông tin chi tiết sẽ xuất hiện tại đây.
          </p>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW (Compact Cards) */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {paginatedClaims.map((claim) => {
            const statusInfo = getStatusBadge(claim.status);
            const payoutAmount = getExpectedPayout(claim);

            return (
              <div
                key={claim.id}
                onClick={() => openClaimDetail(claim)}
                className={`bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs transition flex flex-col justify-between space-y-3.5 group cursor-pointer ${isSurveyor ? "hover:border-blue-400 hover:shadow-md" : "hover:border-emerald-400 hover:shadow-md"
                  }`}
              >
                <div>
                  {/* Header: #ID & Status */}
                  <div className="flex justify-between items-start gap-2 mb-2.5">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <span className={`font-mono font-bold text-xs ${isSurveyor ? "bg-blue-600 text-white" : "bg-emerald-600 text-white"} px-2.5 py-0.5 rounded-lg`}>
                        Phiếu #{claim.id}
                      </span>
                      <span className="text-[11px] font-bold text-slate-900 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200">
                        Đơn #{claim.bookingId}
                      </span>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border ${statusInfo.color}`}
                    >
                      {statusInfo.icon}
                      <span className="truncate max-w-[130px]">{statusInfo.label}</span>
                    </span>
                  </div>

                  {/* Sự cố tiêu đề */}
                  <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-1 group-hover:text-slate-900 transition">
                    {claim.issueTitle || "Yêu cầu bảo hành sơn"}
                  </h3>

                  {/* Thông tin cốt lõi */}
                  <div className="space-y-1.5 text-xs text-slate-500 mt-3 border-t border-slate-200/70 pt-2.5">
                    <div className="flex items-center gap-1.5 text-slate-900 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-slate-900 shrink-0" />
                      <span className="truncate">{claim.address || "Địa chỉ công trình"}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-0.5">
                      <div className="flex items-center gap-1.5 truncate">
                        <User className="w-3.5 h-3.5 text-slate-900 shrink-0" />
                        <span className="font-semibold text-slate-900 truncate">
                          {claim.customerName || "Khách hàng"}
                        </span>
                      </div>
                      {claim.customerPhone && (
                        <a
                          href={`tel:${claim.customerPhone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold text-slate-900 bg-slate-50 hover:bg-[#E2E8F0] hover:text-slate-900 rounded transition border border-slate-200"
                          title="Gọi cho khách hàng"
                        >
                          <Phone className="w-3 h-3 text-slate-900" />
                          <span>{claim.customerPhone}</span>
                        </a>
                      )}
                    </div>

                    {claim.preferredDate && (
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Calendar className="w-3.5 h-3.5 text-slate-900 shrink-0" />
                        <span className="text-slate-500">
                          Lịch hẹn: <strong className="text-slate-900">{new Date(claim.preferredDate).toLocaleDateString("vi-VN")}</strong> {claim.preferredTime ? `(${claim.preferredTime})` : ""}
                        </span>
                      </div>
                    )}

                    {/* Vật tư Giám sát chuẩn bị nếu có */}
                    {claim.materialNote && (
                      <div className="text-[11px] text-slate-900 bg-[#E2E8F0]/60 p-1.5 rounded border border-slate-200 truncate">
                        <strong>📦 Vật tư:</strong> {claim.materialNote}
                      </div>
                    )}
                  </div>

                  {/* Highlight Thù lao Bảo Hành */}
                  <div className="mt-3 p-2 bg-[#E2E8F0] border border-slate-200 rounded-lg flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1">
                      <Wallet className="w-3.5 h-3.5 text-slate-900" />
                      <span>Thù lao {isSurveyor ? "khảo sát & NT" : "khắc phục"}:</span>
                    </span>
                    <span className="text-xs font-black text-slate-900 font-mono">
                      {payoutAmount === 0 ? "0đ (Trách nhiệm)" : formatMoney(payoutAmount)}
                    </span>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div
                  className="pt-2.5 border-t border-slate-200 flex items-center justify-between gap-2 flex-wrap"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => openClaimDetail(claim)}
                    className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-900 text-xs font-bold border border-slate-200 transition flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-900" />
                    <span>Chi tiết</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {/* Hành động Thợ */}
                    {!isSurveyor && (
                      <>
                        {claim.status === "ACCEPTED" && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setRejectJobClaim(claim);
                                setRejectReason("");
                              }}
                              className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold transition cursor-pointer"
                              title="Từ chối nhận việc"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStartRepair(claim)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>Bắt đầu làm</span>
                            </button>
                          </>
                        )}

                        {claim.status === "IN_PROGRESS" && (
                          <button
                            type="button"
                            onClick={() => setWorkerCompleteClaim(claim)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Báo xong</span>
                          </button>
                        )}

                        {claim.status === "WORKER_COMPLETED" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-xl border border-teal-200">
                            <Clock className="w-3 h-3 text-teal-600" />
                            <span>Chờ nghiệm thu</span>
                          </span>
                        )}

                        {claim.status === "COMPLETED" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            <span>Đã hoàn tất</span>
                          </span>
                        )}
                      </>
                    )}

                    {/* Hành động Giám Sát */}
                    {isSurveyor && (
                      <>
                        {claim.status === "SURVEY_ASSIGNED" && (
                          <>
                            <button
                              type="button"
                              onClick={() => openSupervisorRejectModal(claim)}
                              className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold transition cursor-pointer"
                              title="Từ chối nhận việc"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSupervisorAcceptJob(claim)}
                              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Tiếp nhận</span>
                            </button>
                          </>
                        )}

                        {claim.status === "SURVEYOR_ACCEPTED" && (
                          <button
                            type="button"
                            onClick={() => openReportModal(claim)}
                            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <ClipboardCheck className="w-3.5 h-3.5" />
                            <span>Báo cáo KS</span>
                          </button>
                        )}

                        {claim.status === "WORKER_COMPLETED" && (
                          <button
                            type="button"
                            onClick={() => openSupervisorAcceptModal(claim)}
                            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Award className="w-3.5 h-3.5" />
                            <span>Nghiệm thu</span>
                          </button>
                        )}

                        {claim.status === "SURVEYED" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200">
                            <Check className="w-3.5 h-3.5" />
                            <span>Đã nộp báo cáo</span>
                          </span>
                        )}

                        {claim.status === "COMPLETED" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            <span>Đã nghiệm thu</span>
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-slate-400 uppercase text-[10px] font-black tracking-wider border-b border-slate-100">
                  <th className="py-3.5 px-4">#Mã Phiếu</th>
                  <th className="py-3.5 px-4">Khách hàng &amp; Địa chỉ</th>
                  <th className="py-3.5 px-4">Hiện tượng sự cố</th>
                  <th className="py-3.5 px-4">Thù lao {isSurveyor ? "GS" : "Thợ"}</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedClaims.map((claim) => {
                  const statusInfo = getStatusBadge(claim.status);
                  const payoutAmount = getExpectedPayout(claim);

                  return (
                    <tr
                      key={claim.id}
                      onClick={() => openClaimDetail(claim)}
                      className="hover:bg-slate-50/80 transition cursor-pointer group"
                    >
                      <td className="py-3 px-4 align-middle">
                        <span className={`font-mono font-black ${isSurveyor ? "text-blue-600 bg-blue-50 border-blue-200" : "text-emerald-700 bg-emerald-50 border-emerald-200"} px-2 py-0.5 rounded border`}>
                          #{claim.id}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Đơn #{claim.bookingId}
                        </div>
                      </td>

                      <td className="py-3 px-4 align-middle">
                        <div className="font-bold text-slate-900 line-clamp-1">
                          {claim.customerName || "Khách hàng"}
                        </div>
                        <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {claim.address || "Chưa có địa chỉ"}
                        </div>
                      </td>

                      <td className="py-3 px-4 align-middle max-w-xs">
                        <span className="font-medium text-slate-900 line-clamp-1">
                          {claim.issueTitle || claim.description || "Bảo hành"}
                        </span>
                      </td>

                      <td className="py-3 px-4 align-middle">
                        {payoutAmount === 0 ? (
                          <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200">
                            0đ (Trách nhiệm)
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold text-xs font-mono border border-emerald-200">
                            {formatMoney(payoutAmount)}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 align-middle">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border ${statusInfo.color}`}
                        >
                          {statusInfo.icon}
                          <span>{statusInfo.label}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 align-middle text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Nút Xem chi tiết */}
                          <button
                            type="button"
                            onClick={() => openClaimDetail(claim)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 transition cursor-pointer shadow-xs flex items-center gap-1 text-xs"
                            title="Xem chi tiết phiếu"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>Chi tiết</span>
                          </button>

                          {/* Thao tác Thợ */}
                          {!isSurveyor && (
                            <>
                              {claim.status === "ACCEPTED" && (
                                <button
                                  type="button"
                                  onClick={() => handleStartRepair(claim)}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-xs cursor-pointer text-xs flex items-center gap-1"
                                >
                                  <Play className="w-3.5 h-3.5 fill-current" />
                                  <span>Bắt đầu làm</span>
                                </button>
                              )}

                              {claim.status === "IN_PROGRESS" && (
                                <button
                                  type="button"
                                  onClick={() => setWorkerCompleteClaim(claim)}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-xs cursor-pointer text-xs flex items-center gap-1"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Báo xong</span>
                                </button>
                              )}
                            </>
                          )}

                          {/* Thao tác Giám Sát */}
                          {isSurveyor && (
                            <>
                              {claim.status === "SURVEY_ASSIGNED" && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => openSupervisorRejectModal(claim)}
                                    className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold transition cursor-pointer"
                                    title="Từ chối nhận việc"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSupervisorAcceptJob(claim)}
                                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-xs cursor-pointer text-xs flex items-center gap-1"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Tiếp nhận</span>
                                  </button>
                                </>
                              )}

                              {claim.status === "SURVEYOR_ACCEPTED" && (
                                <button
                                  type="button"
                                  onClick={() => openReportModal(claim)}
                                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-xs cursor-pointer text-xs flex items-center gap-1"
                                >
                                  <ClipboardCheck className="w-3.5 h-3.5" />
                                  <span>Báo cáo KS</span>
                                </button>
                              )}

                              {claim.status === "WORKER_COMPLETED" && (
                                <button
                                  type="button"
                                  onClick={() => openSupervisorAcceptModal(claim)}
                                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-xs cursor-pointer text-xs flex items-center gap-1"
                                >
                                  <Award className="w-3.5 h-3.5" />
                                  <span>Nghiệm thu</span>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && filteredClaims.length > itemsPerPage && (
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredClaims.length}
            itemsPerPage={itemsPerPage}
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* DETAIL MODAL: XEM CHI TIẾT BẢO HÀNH (3 TAB ĐẦY ĐỦ)        */}
      {/* ========================================================= */}
      {selectedClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-xl ${isSurveyor ? "bg-blue-600 border-blue-600" : "bg-emerald-600 border-emerald-600"} text-white flex items-center justify-center font-bold text-sm shrink-0 border shadow-xs`}>
                  <ShieldAlert className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-mono font-bold text-xs ${isSurveyor ? "bg-blue-600 text-white" : "bg-emerald-600 text-white"} px-2.5 py-0.5 rounded-lg`}>
                      Phiếu #{selectedClaim.id}
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      Đơn #{selectedClaim.bookingId} - {selectedClaim.issueTitle || "Bảo hành"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {selectedClaim.address}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedClaim(null)}
                className="w-8 h-8 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Top Metric Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 sm:px-6 bg-white border-b border-slate-200">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Thù lao {isSurveyor ? "Giám sát" : "Thợ"} nhận
                </span>
                <span className="text-base sm:text-lg font-black text-emerald-700 font-mono block mt-0.5">
                  {formatMoney(getExpectedPayout(selectedClaim))}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Phân loại lỗi
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-900 block mt-0.5">
                  {selectedClaim.faultType === "COMPANY_FAULT"
                    ? "Lỗi kỹ thuật (0đ)"
                    : selectedClaim.faultType === "CUSTOMER_FAULT"
                      ? "Lỗi khách quan"
                      : "Chờ thẩm định"}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Lịch hẹn khách
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-900 block mt-0.5 truncate">
                  {selectedClaim.preferredDate
                    ? new Date(selectedClaim.preferredDate).toLocaleDateString("vi-VN")
                    : "Chưa đặt lịch"}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Trạng thái
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-900 block mt-0.5 truncate">
                  {getStatusBadge(selectedClaim.status).label}
                </span>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex border-b border-slate-200 px-4 sm:px-6 bg-white gap-2 sm:gap-4 overflow-x-auto">
              {[
                { key: "overview", label: "Sự cố & Khách hàng", icon: ShieldAlert },
                { key: "survey_result", label: "Thẩm định & Vật tư", icon: Layers },
                { key: "completion", label: "Nghiệm thu & Thù lao", icon: Award },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = detailTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setDetailTab(tab.key)}
                    className={`py-3 px-2 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${active
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

            {/* Tab Content */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 text-xs space-y-4">
              {/* TAB 1: SỰ CỐ & KHÁCH HÀNG */}
              {detailTab === "overview" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Chủ nhà */}
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2.5">
                      <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-900" />
                        <span>Thông tin chủ nhà</span>
                      </h4>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between py-1 border-b border-slate-200/60">
                          <span className="text-slate-500">Họ tên:</span>
                          <strong className="text-slate-900">{selectedClaim.customerName}</strong>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-200/60">
                          <span className="text-slate-500">SĐT:</span>
                          {selectedClaim.customerPhone ? (
                            <a
                              href={`tel:${selectedClaim.customerPhone}`}
                              className="font-bold text-slate-900 hover:text-slate-900 flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200"
                            >
                              <Phone className="w-3 h-3 text-slate-900" />
                              <span>{selectedClaim.customerPhone}</span>
                            </a>
                          ) : (
                            <span className="text-slate-500">Chưa có</span>
                          )}
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-slate-500">Khung giờ hẹn:</span>
                          <span className="text-slate-900 font-semibold">{selectedClaim.preferredTime || "Trong giờ hành chính"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Địa chỉ */}
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2.5">
                      <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-900" />
                        <span>Địa điểm bảo hành</span>
                      </h4>
                      <p className="font-semibold text-xs text-slate-900 leading-relaxed">
                        {selectedClaim.address}
                      </p>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedClaim.address || "Hà Nội")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-900 font-semibold rounded-lg border border-slate-200 transition text-[11px]"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-slate-900" />
                        <span>Mở Google Maps</span>
                      </a>
                    </div>
                  </div>

                  {/* Mô tả sự cố */}
                  <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-2.5">
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-slate-900" />
                      <span>Nội dung sự cố khách báo: {selectedClaim.issueTitle || ""}</span>
                    </h4>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-900 leading-relaxed">
                      {selectedClaim.description || "Khách yêu cầu kiểm tra và xử lý lại bề mặt sơn."}
                    </div>

                    {/* Ảnh khách gửi */}
                    {parseImages(selectedClaim.imageUrls).length > 0 && (
                      <div className="pt-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">
                          Ảnh sự cố do khách hàng gửi ({parseImages(selectedClaim.imageUrls).length}):
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {parseImages(selectedClaim.imageUrls).map((img, i) => (
                            <img
                              key={i}
                              src={img}
                              alt="Khách gửi"
                              onClick={() => setPreviewImage(img)}
                              className="w-16 h-16 rounded-lg object-cover border border-slate-200 cursor-pointer hover:opacity-80 transition"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: THẨM ĐỊNH & VẬT TƯ */}
              {detailTab === "survey_result" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Ghi chú thẩm định */}
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">
                        Đánh giá nguyên nhân &amp; Kết luận của Giám sát
                      </span>
                      <div className="p-3 bg-white rounded-lg border border-slate-200 min-h-[90px] text-xs text-slate-900 leading-relaxed">
                        {selectedClaim.surveyNote || "Chưa có ghi chép thẩm định hiện trường từ Giám sát viên."}
                      </div>
                    </div>

                    {/* Vật tư Giám sát chuẩn bị cho thợ */}
                    <div className="bg-[#E2E8F0]/40 p-4 rounded-lg border border-slate-200 space-y-2">
                      <span className="text-[10px] font-bold text-slate-900 uppercase flex items-center gap-1">
                        <Package className="w-3.5 h-3.5 text-slate-900" />
                        <span>Vật tư Giám sát đã chuẩn bị sẵn cho thợ</span>
                      </span>
                      <div className="p-3 bg-white rounded-lg border border-slate-200 min-h-[90px] text-xs text-slate-900 font-semibold leading-relaxed">
                        {selectedClaim.materialNote || "Giám sát chưa ghi nhận vật tư cần chuẩn bị."}
                      </div>
                    </div>
                  </div>

                  {/* Ảnh thẩm định hiện trường */}
                  {parseImages(selectedClaim.surveyImages).length > 0 && (
                    <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">
                        Ảnh đo đạc hiện trường do Giám sát chụp ({parseImages(selectedClaim.surveyImages).length}):
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {parseImages(selectedClaim.surveyImages).map((img, i) => (
                          <img
                            key={i}
                            src={img}
                            alt="Khảo sát"
                            onClick={() => setPreviewImage(img)}
                            className="w-16 h-16 rounded-lg object-cover border border-slate-200 cursor-pointer hover:opacity-80 transition"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: NGHIỆM THU & THÙ LAO */}
              {detailTab === "completion" && (
                <div className="space-y-4">
                  {/* Banner thù lao */}
                  <div className="bg-[#E2E8F0] p-4 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-900 tracking-wider">
                        Thù lao {isSurveyor ? "Giám sát viên" : "Đội thợ thi công"}
                      </span>
                      <div className="text-2xl font-black text-slate-900 font-mono mt-0.5">
                        {getExpectedPayout(selectedClaim) === 0 ? "0đ (Trách nhiệm)" : formatMoney(getExpectedPayout(selectedClaim))}
                      </div>
                      <p className="text-[11px] text-slate-900/80 mt-0.5">
                        {getExpectedPayout(selectedClaim) === 0 ? "Bảo hành trách nhiệm cho đơn công trình trước đó, không phát sinh chi phí thù lao." : "Quyết toán tự động sau khi hoàn tất nghiệm thu thực tế với khách hàng."}
                      </p>
                    </div>
                    <div>
                      {(!isSurveyor ? selectedClaim.workerPaid : selectedClaim.surveyorPaid) ? (
                        <span className="inline-block px-3 py-1 bg-blue-600 text-white font-bold text-xs rounded shadow-xs">
                          ✓ Đã thanh toán vào ví
                        </span>
                      ) : getExpectedPayout(selectedClaim) === 0 ? (
                        <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 font-bold text-xs rounded border border-slate-200">
                          ✓ 0đ (Bảo hành trách nhiệm)
                        </span>
                      ) : (
                        <span className="inline-block px-3 py-1 bg-white text-slate-900 font-bold text-xs rounded border border-slate-200">
                          ⏳ Đang chờ Admin quyết toán
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Ảnh nghiệm thu hoàn thành */}
                  {parseImages(selectedClaim.resolvedImageUrls).length > 0 ? (
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-900 uppercase flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                          <span>Ảnh Giám sát nghiệm thu hoàn tất ({parseImages(selectedClaim.resolvedImageUrls).length}):</span>
                        </span>
                        <span className="text-[10px] bg-slate-50 text-slate-900 font-bold px-2 py-0.5 rounded">
                          Đạt chuẩn 100%
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {parseImages(selectedClaim.resolvedImageUrls).map((img, i) => (
                          <img
                            key={i}
                            src={img}
                            alt="Nghiệm thu"
                            onClick={() => setPreviewImage(img)}
                            className="w-16 h-16 rounded-lg object-cover border border-slate-200 cursor-pointer hover:opacity-80 transition"
                          />
                        ))}
                      </div>
                      {selectedClaim.supervisorNote && (
                        <div className="p-2.5 bg-white rounded border border-slate-200 text-xs text-slate-900 mt-2">
                          <strong>Nhận xét:</strong> {selectedClaim.supervisorNote}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-6 text-center bg-slate-50 rounded-lg border border-slate-200 text-slate-500">
                      <Award className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-xs text-slate-900">Chưa hoàn tất nghiệm thu</p>
                      <p className="text-[11px] mt-0.5">Sau khi thợ thi công xong, Giám sát viên sẽ chụp ảnh và gửi biên bản nghiệm thu.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Modal Action Bar */}
            <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500">Trạng thái:</span>
                <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border ${getStatusBadge(selectedClaim.status).color}`}>
                  {getStatusBadge(selectedClaim.status).icon}
                  <span>{getStatusBadge(selectedClaim.status).label}</span>
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Thao tác Thợ */}
                {!isSurveyor && (
                  <>
                    {selectedClaim.status === "ACCEPTED" && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setRejectJobClaim(selectedClaim);
                            setRejectReason("");
                          }}
                          className="px-4 py-2 rounded-lg bg-slate-50 hover:bg-slate-50 text-slate-900 font-semibold border border-slate-200 transition text-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Từ chối nhận việc</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartRepair(selectedClaim)}
                          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition text-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Bắt đầu thi công</span>
                        </button>
                      </>
                    )}

                    {selectedClaim.status === "IN_PROGRESS" && (
                      <button
                        type="button"
                        onClick={() => setWorkerCompleteClaim(selectedClaim)}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Báo Hoàn Thành Thi Công</span>
                      </button>
                    )}
                  </>
                )}

                {/* Thao tác Giám Sát */}
                {isSurveyor && (
                  <>
                    {selectedClaim.status === "SURVEY_ASSIGNED" && (
                      <>
                        <button
                          type="button"
                          onClick={() => openSupervisorRejectModal(selectedClaim)}
                          className="px-4 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold border border-rose-200 transition text-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Từ chối nhận việc</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSupervisorAcceptJob(selectedClaim)}
                          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition text-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Tiếp Nhận Khảo Sát</span>
                        </button>
                      </>
                    )}

                    {selectedClaim.status === "SURVEYOR_ACCEPTED" && (
                      <button
                        type="button"
                        onClick={() => openReportModal(selectedClaim)}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <ClipboardCheck className="w-3.5 h-3.5" />
                        <span>Lập Báo Cáo Khảo Sát</span>
                      </button>
                    )}

                    {selectedClaim.status === "WORKER_COMPLETED" && (
                      <button
                        type="button"
                        onClick={() => openSupervisorAcceptModal(selectedClaim)}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>Nghiệm Thu Hiện Trường</span>
                      </button>
                    )}
                  </>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedClaim(null)}
                  className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-900 font-bold rounded-xl border border-slate-200 text-xs transition cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: GIÁM SÁT LẬP BÁO CÁO KHẢO SÁT                     */}
      {/* ========================================================= */}
      {reportModalClaim && (
        <Modal
          isOpen={Boolean(reportModalClaim)}
          onClose={() => setReportModalClaim(null)}
          title={`Báo Cáo Khảo Sát Thẩm Định Bảo Hành #${reportModalClaim.id}`}
          maxWidth="max-w-xl"
        >
          <form onSubmit={handleSubmitSurveyReport} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Đơn hàng:</span>
                <strong className="text-slate-900">#{reportModalClaim.bookingId} - {reportModalClaim.serviceName || "Sơn sửa"}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Khách hàng:</span>
                <strong className="text-slate-900">{reportModalClaim.customerName} ({reportModalClaim.customerPhone})</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Địa chỉ:</span>
                <span className="text-slate-900 font-medium text-right line-clamp-1">{reportModalClaim.address}</span>
              </div>
            </div>

            {/* 1. Kết luận nguyên nhân */}
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-900 text-xs uppercase tracking-wider">
                1. Kết Luận Nguyên Nhân Sự Cố <span className="text-slate-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <label
                  className={`p-3 rounded-lg border flex items-start gap-2.5 cursor-pointer transition ${faultType === "COMPANY_FAULT"
                    ? "bg-slate-50 border-blue-600 text-slate-900 shadow-xs"
                    : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                >
                  <input
                    type="radio"
                    name="faultType"
                    value="COMPANY_FAULT"
                    checked={faultType === "COMPANY_FAULT"}
                    onChange={(e) => setFaultType(e.target.value)}
                    className="mt-0.5 text-slate-500 focus:ring-blue-500/20"
                  />
                  <div>
                    <strong className="block text-xs text-slate-900">Lỗi kỹ thuật thi công</strong>
                    <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                      Bong tróc, ố vàng do thi công hoặc sơn. Bảo hành 100% Miễn Phí (0đ).
                    </span>
                  </div>
                </label>

                <label
                  className={`p-3 rounded-lg border flex items-start gap-2.5 cursor-pointer transition ${faultType === "CUSTOMER_FAULT"
                    ? "bg-slate-50 border-slate-200 text-slate-900 shadow-xs"
                    : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                >
                  <input
                    type="radio"
                    name="faultType"
                    value="CUSTOMER_FAULT"
                    checked={faultType === "CUSTOMER_FAULT"}
                    onChange={(e) => setFaultType(e.target.value)}
                    className="mt-0.5 text-slate-900 focus:ring-blue-500/20"
                  />
                  <div>
                    <strong className="block text-xs text-slate-900">Lỗi khách quan / Ngoại lực</strong>
                    <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                      Thấm từ tường ngoài, va đập, khoan đục... Đề xuất giá hỗ trợ khách.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* 2. Ghi chú hiện trạng */}
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-900">
                2. Ghi Chú Hiện Trạng Kiểm Tra Chi Tiết <span className="text-slate-500">*</span>
              </label>
              <textarea
                rows={3}
                value={surveyNote}
                onChange={(e) => setSurveyNote(e.target.value)}
                required
                placeholder="Ví dụ: Đo độ ẩm tường phòng khách 18%, màng sơn bị rộp khoảng 1m2..."
                className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900 leading-relaxed"
              />
            </div>

            {/* 3. Vật tư cần chuẩn bị */}
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-900 flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-slate-900" />
                <span>3. Vật Tư Giám Sát Chuẩn Bị Cho Thợ Khắc Phục</span>
              </label>
              <textarea
                rows={2}
                value={materialNote}
                onChange={(e) => setMaterialNote(e.target.value)}
                placeholder="Ví dụ: 01 lon sơn Dulux Weathershield mã màu 2110 + 02 kg bột bả + giấy ráp (Giám sát sẽ mang giao cho thợ)..."
                className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900 leading-relaxed"
              />
            </div>

            {/* 4. Mức giá đề xuất hỗ trợ */}
            {faultType === "CUSTOMER_FAULT" && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                <label className="block font-semibold text-slate-900">
                  4. Mức Giá Đề Xuất Sửa Chữa Hỗ Trợ Khách (VNĐ)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={suggestedPrice}
                    onChange={(e) => setSuggestedPrice(e.target.value)}
                    placeholder="300000"
                    className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono font-bold text-slate-900 text-sm"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">VNĐ</span>
                </div>
              </div>
            )}

            {/* 5. Tải ảnh hiện trường */}
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-900 flex items-center justify-between">
                <span>5. Ảnh Chụp Đo Đạc Hiện Trường (Tối đa 6 ảnh)</span>
                <span className="text-[11px] text-slate-500">{surveyFiles.length}/6 ảnh</span>
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleSurveyFilesChange}
                className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 text-slate-900"
              />
              {surveyFilePreviews.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {surveyFilePreviews.map((url, i) => (
                    <div key={i} className="w-14 h-14 rounded-lg overflow-hidden border border-slate-200 relative group">
                      <img src={url} alt="Khảo sát" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveSurveyFile(i)}
                        className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setReportModalClaim(null)}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-900 font-semibold rounded-lg transition cursor-pointer border border-slate-200"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submittingReport}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>{submittingReport ? "Đang gửi báo cáo..." : "Gửi Báo Cáo Thẩm Định"}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: GIÁM SÁT NGHIỆM THU HIỆN TRƯỜNG & GỬI ẢNH BÁO CÁO */}
      {/* ========================================================= */}
      {supervisorAcceptClaim && (
        <Modal
          isOpen={Boolean(supervisorAcceptClaim)}
          onClose={() => setSupervisorAcceptClaim(null)}
          title={`Nghiệm Thu Hiện Trường & Báo Cáo Hoàn Tất #${supervisorAcceptClaim.id}`}
          maxWidth="max-w-xl"
        >
          <form onSubmit={handleSubmitSupervisorAccept} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5 text-slate-900">
              <div className="font-bold flex items-center gap-1.5 text-slate-900 text-xs">
                <Award className="w-4 h-4 text-slate-500" />
                <span>Biên bản nghiệm thu chất lượng cùng khách hàng</span>
              </div>
              <p className="text-[11px] text-slate-900 leading-relaxed">
                Giám sát kiểm tra thực tế màng sơn sau khi thợ khắc phục, chụp ảnh hoàn thiện và gửi biên bản để Admin quyết toán thù lao.
              </p>
            </div>

            {/* 1. Tải ảnh hoàn thành */}
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-900 flex items-center justify-between">
                <span>1. Ảnh Chụp Nghiệm Thu Hoàn Thiện Thực Tế (Tối đa 6 ảnh) <span className="text-slate-500">*</span></span>
                <span className="text-[11px] text-slate-500">{resolvedFiles.length}/6 ảnh</span>
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleResolvedFilesChange}
                className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 text-slate-900"
              />
              {resolvedFilePreviews.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {resolvedFilePreviews.map((url, i) => (
                    <div key={i} className="w-14 h-14 rounded-lg overflow-hidden border border-slate-200 relative group">
                      <img src={url} alt="Nghiệm thu" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveResolvedFile(i)}
                        className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Ghi chú nghiệm thu */}
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-900">2. Ghi Chú Đánh Giá Nghiệm Thu Cùng Khách Hàng</label>
              <textarea
                rows={3}
                value={supervisorNote}
                onChange={(e) => setSupervisorNote(e.target.value)}
                placeholder="Ghi chú đánh giá độ bám dính, độ bóng màng sơn, sự hài lòng của khách hàng..."
                className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900 leading-relaxed"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSupervisorAcceptClaim(null)}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-900 font-bold rounded-xl transition cursor-pointer border border-slate-200"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submittingAccept}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{submittingAccept ? "Đang gửi..." : "Xác Nhận Nghiệm Thu & Báo Cáo"}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: THỢ BÁO CÁO HOÀN THÀNH                            */}
      {/* ========================================================= */}
      {workerCompleteClaim && (
        <Modal
          isOpen={Boolean(workerCompleteClaim)}
          onClose={() => setWorkerCompleteClaim(null)}
          title={`Xác Nhận Hoàn Thành Thi Công Phiếu #${workerCompleteClaim.id}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-slate-900">
              <div className="font-bold flex items-center gap-1.5 text-slate-900 text-xs">
                <CheckCircle2 className="w-4 h-4 text-slate-500" />
                <span>Báo hoàn thành thi công</span>
              </div>
              <p className="text-[11px] text-slate-900 leading-relaxed">
                Bạn xác nhận đã hoàn thành toàn bộ hạng mục dặm vá, khắc phục sự cố bảo hành cho đơn hàng #<strong>{workerCompleteClaim.bookingId}</strong>?
              </p>
              <p className="text-[11px] text-slate-900 font-medium">
                • Sau khi bấm xác nhận, hệ thống sẽ tự động thông báo đến <strong>Giám sát viên</strong> để đến hiện trường chụp ảnh và nghiệm thu chất lượng cùng khách hàng.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setWorkerCompleteClaim(null)}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-900 font-bold rounded-xl transition cursor-pointer border border-slate-200"
              >
                Chưa xong
              </button>
              <button
                type="button"
                disabled={submittingWorkerComplete}
                onClick={handleConfirmWorkerComplete}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{submittingWorkerComplete ? "Đang lưu..." : "Xác Nhận Báo Hoàn Thành"}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: THỢ TỪ CHỐI NHẬN VIỆC                            */}
      {/* ========================================================= */}
      {rejectJobClaim && (
        <Modal
          isOpen={Boolean(rejectJobClaim)}
          onClose={() => setRejectJobClaim(null)}
          title={`Từ Chối Nhận Việc Bảo Hành #${rejectJobClaim.id}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleConfirmTechnicianReject} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5 text-slate-900">
              <div className="font-bold flex items-center gap-1.5 text-slate-900">
                <AlertTriangle className="w-4 h-4 text-slate-500" />
                <span>Xác nhận từ chối nhận công việc</span>
              </div>
              <p className="text-[11px] text-slate-900 leading-relaxed">
                Sau khi từ chối, hệ thống sẽ gửi thông báo đến <strong>Ban Quản Trị</strong> và <strong>Giám sát</strong> để điều phối Đội thợ khác phụ trách.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-900">
                Lý do từ chối nhận việc <span className="text-slate-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ví dụ: Trùng lịch thi công công trình khác, bận đột xuất..."
                className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 leading-relaxed text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setRejectJobClaim(null)}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-900 font-bold rounded-xl transition cursor-pointer border border-slate-200"
              >
                Đóng
              </button>
              <button
                type="submit"
                disabled={submittingRejectJob}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                <span>{submittingRejectJob ? "Đang gửi..." : "Xác Nhận Từ Chối"}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================= */}
      {/* ========================================================= */}
      {/* MODAL 5: GIÁM SÁT TỪ CHỐI NHẬN VIỆC                       */}
      {/* ========================================================= */}
      {rejectSupervisorClaim && (
        <Modal
          isOpen={Boolean(rejectSupervisorClaim)}
          onClose={() => setRejectSupervisorClaim(null)}
          title={`Từ Chối Nhận Việc Khảo Sát #${rejectSupervisorClaim.id}`}
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleConfirmSupervisorReject} className="space-y-4 text-xs">
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 leading-relaxed text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                Bạn đang từ chối nhận nhiệm vụ khảo sát này. Hệ thống sẽ chuyển trạng thái sang <strong>Giám sát từ chối việc</strong> và thông báo đến Ban Quản Trị để điều phối Giám sát viên khác.
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-900">
                Lý do từ chối nhận việc <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={rejectSupervisorReason}
                onChange={(e) => setRejectSupervisorReason(e.target.value)}
                placeholder="Ví dụ: Trùng lịch khảo sát công trình khác, khu vực quá xa..."
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 leading-relaxed text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setRejectSupervisorClaim(null)}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-900 font-bold rounded-xl transition cursor-pointer border border-slate-200"
              >
                Đóng
              </button>
              <button
                type="submit"
                disabled={submittingRejectSupervisor}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                <span>{submittingRejectSupervisor ? "Đang gửi..." : "Xác Nhận Từ Chối Nhận Việc"}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Lightbox Modal */}
      {previewImage && (
        <ImageLightboxModal
          isOpen={Boolean(previewImage)}
          imageUrl={previewImage}
          onClose={() => setPreviewImage(null)}
        />
      )}
    </div>
  );
}
