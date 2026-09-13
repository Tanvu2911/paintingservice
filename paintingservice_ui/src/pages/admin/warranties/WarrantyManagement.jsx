import { useState, useEffect, useMemo } from "react";
import { useOutletContext, useNavigate, Link } from "react-router-dom";
import AxiosConfig from "../../../util/AxiosConfig";
import DashboardHeader from "../../../components/layout/DashboardHeader";
import Modal from "../../../components/common/Modal";
import LoadingSpinner from "../../../components/common/LoadingSpinner";
import ImageLightboxModal from "../../../components/common/ImageLightboxModal";
import Pagination from "../../../components/common/Pagination";
import { formatMoney } from "../../../util/formatters";
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
  ExternalLink,
  RefreshCw,
  MapPin,
  ClipboardCheck,
  Package,
  DollarSign,
  UserCheck,
  QrCode,
  Check,
  ArrowRight,
  Eye,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export default function WarrantyManagement() {
  const context = useOutletContext() || {};
  const showToast = context.showToast;
  const navigate = useNavigate();

  const [claims, setClaims] = useState([]);
  const [surveyors, setSurveyors] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Preview Image
  const [previewImage, setPreviewImage] = useState(null);

  // Modal 1: Phân công Giám sát nhanh
  const [assignSurveyorModal, setAssignSurveyorModal] = useState(null);
  const [selectedSurveyorId, setSelectedSurveyorId] = useState("");
  const [surveyorAdminNote, setSurveyorAdminNote] = useState("");
  const [supervisorModalTab, setSupervisorModalTab] = useState("all");
  const [supervisorSearch, setSupervisorSearch] = useState("");
  const [submittingSurveyor, setSubmittingSurveyor] = useState(false);

  const fetchClaims = async () => {
    try {
      const res = await AxiosConfig.get("/warranty-claims");
      setClaims(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Lỗi tải danh sách bảo hành:", err);
      showToast?.("Không thể tải danh sách phiếu bảo hành!", "error");
    }
  };

  const fetchStaff = async () => {
    try {
      const [supRes, workerRes] = await Promise.all([
        AxiosConfig.get("/staff?staffType=SUPERVISOR").catch(() => ({ data: [] })),
        AxiosConfig.get("/staff?staffType=WORKER").catch(() => ({ data: [] })),
      ]);

      let rawSup = Array.isArray(supRes.data) ? supRes.data : (supRes.data?.content || supRes.data?.data || []);
      let rawWorker = Array.isArray(workerRes.data) ? workerRes.data : (workerRes.data?.content || workerRes.data?.data || []);

      if (rawSup.length === 0 && rawWorker.length === 0) {
        const allRes = await AxiosConfig.get("/staff").catch(() => ({ data: [] }));
        const list = Array.isArray(allRes.data) ? allRes.data : (allRes.data?.content || allRes.data?.data || []);
        rawSup = list.filter(
          (s) =>
            s.role === "ROLE_SURVEYOR" ||
            s.role === "ROLE_SUPERVISOR" ||
            s.staffType === "SUPERVISOR" ||
            s.staffType === "SURVEYOR"
        );
        rawWorker = list.filter(
          (s) =>
            s.role === "ROLE_TECHNICIAN" ||
            s.role === "ROLE_WORKER" ||
            s.staffType === "WORKER" ||
            s.staffType === "TECHNICIAN"
        );
      }

      setSurveyors(rawSup);
      setTechnicians(rawWorker);
    } catch (err) {
      console.error("Lỗi tải danh sách nhân sự:", err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchClaims(), fetchStaff()]);
    setRefreshing(false);
    showToast?.("Đã làm mới dữ liệu thành công!", "success");
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchClaims(), fetchStaff()]);
      setLoading(false);
    };
    init();
  }, []);

  const openAssignSurveyorModal = (claim) => {
    setAssignSurveyorModal(claim);
    setSelectedSurveyorId(claim.surveyorId ? String(claim.surveyorId) : "");
    setSurveyorAdminNote(claim.surveyorAdminNote || "");
    setSupervisorModalTab("all");
    setSupervisorSearch("");
  };

  const handleAssignSurveyorSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSurveyorId) {
      showToast?.("Vui lòng chọn Giám Sát Khảo Sát!", "warning");
      return;
    }

    try {
      setSubmittingSurveyor(true);
      await AxiosConfig.put(`/warranty-claims/${assignSurveyorModal.id}/assign-surveyor`, {
        surveyorId: Number(selectedSurveyorId),
        note: surveyorAdminNote,
      });
      showToast?.("Đã phân công Giám Sát Khảo Sát thành công!", "success");
      setAssignSurveyorModal(null);
      fetchClaims();
    } catch (err) {
      console.error(err);
      showToast?.(err.response?.data?.message || "Lỗi khi phân công Giám sát", "error");
    } finally {
      setSubmittingSurveyor(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-slate-50 text-slate-900 border border-slate-200">
            <Clock className="w-3 h-3 text-slate-900" /> 1. Chờ Phân GS
          </span>
        );
      case "SURVEY_ASSIGNED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-slate-50 text-slate-900 border border-slate-200">
            <UserCheck className="w-3 h-3" /> 2. Đang Khảo Sát
          </span>
        );
      case "SURVEYED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-900 border border-purple-200">
            <ClipboardCheck className="w-3 h-3 text-purple-600" /> 3. Đã Có Báo Cáo
          </span>
        );
      case "CUSTOMER_ACCEPTED_SUPPORT":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-slate-50 text-slate-900 border border-slate-200">
            <Sparkles className="w-3 h-3 text-slate-900" /> 3b. Khách Đồng Ý Hỗ Trợ
          </span>
        );
      case "TECHNICIAN_REJECTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-slate-50 text-slate-900 border border-slate-200">
            <AlertTriangle className="w-3 h-3 text-slate-500" /> 4b. Thợ Từ Chối
          </span>
        );
      case "WORKER_ASSIGNED":
      case "ACCEPTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-slate-50 text-slate-900 border border-slate-200">
            <Wrench className="w-3 h-3" /> 4. Đã Phân Thợ
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-slate-50 text-slate-900 border border-slate-200">
            <Wrench className="w-3 h-3 animate-spin" /> 4. Đang Khắc Phục
          </span>
        );
      case "WORKER_COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-slate-50 text-slate-900 border border-slate-200">
            <Clock className="w-3 h-3" /> 5. Chờ Nghiệm Thu
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-slate-50 text-slate-900 border border-slate-200">
            <CheckCircle2 className="w-3 h-3" /> 6. Đã Hoàn Tất
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-slate-50 text-slate-900 border border-slate-200">
            <XCircle className="w-3 h-3" /> 7. Báo Giá Hỗ Trợ
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-slate-50 text-slate-900 border border-slate-200">
            <XCircle className="w-3.5 h-3.5 text-slate-500" /> Đã Hủy
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-slate-50 text-slate-900">
            {status}
          </span>
        );
    }
  };

  const filteredSupervisors = useMemo(() => {
    const claimAddress = (assignSurveyorModal?.address || "").toLowerCase();
    return surveyors.filter((s) => {
      const name = (s.username || s.fullName || "").toLowerCase();
      const phone = (s.phoneNumber || "").toLowerCase();
      const area = (s.serviceArea || s.address || "").toLowerCase();
      const term = supervisorSearch.toLowerCase().trim();
      const matchSearch = !term || name.includes(term) || phone.includes(term) || area.includes(term);

      if (supervisorModalTab === "district") {
        const isMatchDistrict =
          area &&
          claimAddress &&
          (claimAddress.includes(area) ||
            area.split(",").some((part) => claimAddress.includes(part.trim())));
        return matchSearch && isMatchDistrict;
      }
      if (supervisorModalTab === "idle") {
        return matchSearch && s.available !== false && s.status !== "BUSY";
      }
      return matchSearch;
    });
  }, [surveyors, supervisorSearch, supervisorModalTab, assignSurveyorModal?.address]);

  const filteredClaims = useMemo(() => {
    return claims.filter((claim) => {
      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        String(claim.id).includes(term) ||
        String(claim.bookingId).includes(term) ||
        (claim.customerName && claim.customerName.toLowerCase().includes(term)) ||
        (claim.customerPhone && claim.customerPhone.includes(term)) ||
        (claim.address && claim.address.toLowerCase().includes(term)) ||
        (claim.issueTitle && claim.issueTitle.toLowerCase().includes(term)) ||
        (claim.surveyorName && claim.surveyorName.toLowerCase().includes(term)) ||
        (claim.technicianName && claim.technicianName.toLowerCase().includes(term));

      let matchStatus = true;
      if (statusFilter === "PENDING") matchStatus = claim.status === "PENDING";
      else if (statusFilter === "SURVEY_ASSIGNED") matchStatus = claim.status === "SURVEY_ASSIGNED";
      else if (statusFilter === "SURVEYED")
        matchStatus =
          claim.status === "SURVEYED" ||
          claim.status === "CUSTOMER_ACCEPTED_SUPPORT" ||
          claim.status === "TECHNICIAN_REJECTED";
      else if (statusFilter === "IN_PROGRESS")
        matchStatus = claim.status === "WORKER_ASSIGNED" || claim.status === "IN_PROGRESS" || claim.status === "ACCEPTED";
      else if (statusFilter === "WORKER_COMPLETED") matchStatus = claim.status === "WORKER_COMPLETED";
      else if (statusFilter === "COMPLETED") matchStatus = claim.status === "COMPLETED";
      else if (statusFilter === "REJECTED") matchStatus = claim.status === "REJECTED" || claim.status === "CANCELLED";

      return matchSearch && matchStatus;
    });
  }, [claims, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredClaims.length / itemsPerPage) || 1;
  const currentClaims = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredClaims.slice(start, start + itemsPerPage);
  }, [filteredClaims, currentPage, itemsPerPage]);

  const stats = useMemo(() => {
    const total = claims.length;
    const pending = claims.filter((c) => c.status === "PENDING").length;
    const surveying = claims.filter((c) => c.status === "SURVEY_ASSIGNED").length;
    const surveyed = claims.filter(
      (c) =>
        c.status === "SURVEYED" ||
        c.status === "CUSTOMER_ACCEPTED_SUPPORT" ||
        c.status === "TECHNICIAN_REJECTED"
    ).length;
    const inProgress = claims.filter((c) => c.status === "WORKER_ASSIGNED" || c.status === "IN_PROGRESS" || c.status === "ACCEPTED").length;
    const workerDone = claims.filter((c) => c.status === "WORKER_COMPLETED").length;
    const completed = claims.filter((c) => c.status === "COMPLETED").length;
    const rejected = claims.filter((c) => c.status === "REJECTED" || c.status === "CANCELLED").length;
    const pendingPayout = claims.filter(
      (c) => c.status === "COMPLETED" && (!c.surveyorPaid || !c.workerPaid)
    ).length;

    return { total, pending, surveying, surveyed, inProgress, workerDone, completed, rejected, pendingPayout };
  }, [claims]);

  return (
    <div className="space-y-6 pb-16 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <DashboardHeader
        title="Quản Lý Yêu Cầu Bảo Hành & Khắc Phục Sự Cố"
        subtitle="Tiếp nhận bảo hành, phân Giám sát thẩm định, phân Đội thợ xử lý và quyết toán VietQR"
      >
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-600 text-white font-semibold rounded-lg text-xs transition flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          <span>Làm Mới</span>
        </button>
      </DashboardHeader>

      {/* 4 Thống kê nổi bật */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between border-t-2 border-t-[#1E3A8A]">
          <div>
            <span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider block">Tổng Phiếu Bảo Hành</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block font-mono">{stats.total}</span>
          </div>
          <div className="p-2.5 bg-slate-50 text-slate-900 rounded-lg border border-slate-200 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between border-t-2 border-t-[#1E3A8A]">
          <div>
            <span className="text-slate-900 text-[11px] font-bold uppercase tracking-wider block">Chờ Phân Giám Sát</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block font-mono">{stats.pending}</span>
          </div>
          <div className="p-2.5 bg-slate-50 text-slate-900 rounded-lg border border-slate-200 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between border-t-2 border-t-sky-600">
          <div>
            <span className="text-slate-900 text-[11px] font-bold uppercase tracking-wider block">Đang Khắc Phục / Xong</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block font-mono">{stats.inProgress + stats.workerDone}</span>
          </div>
          <div className="p-2.5 bg-slate-50 text-slate-900 rounded-lg border border-slate-200 shrink-0">
            <Wrench className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between border-t-2 border-t-emerald-600">
          <div>
            <span className="text-slate-900 text-[11px] font-bold uppercase tracking-wider block">Chờ Quyết Toán Tiền Công</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block font-mono">{stats.pendingPayout}</span>
          </div>
          <div className="p-2.5 bg-slate-50 text-slate-900 rounded-lg border border-slate-200 shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs lọc trạng thái */}
      <div className="bg-white rounded-xl border border-slate-200 p-2 shadow-2xs w-full">
        <div
          className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 text-xs font-semibold scrollbar-none px-1 [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {[
            { id: "ALL", label: "Tất Cả", count: stats.total },
            { id: "PENDING", label: "1. Chờ Giám Sát", count: stats.pending },
            { id: "SURVEY_ASSIGNED", label: "2. Đang Khảo Sát", count: stats.surveying },
            { id: "SURVEYED", label: "3. Có Báo Cáo", count: stats.surveyed },
            { id: "IN_PROGRESS", label: "4. Thợ Đang Làm", count: stats.inProgress },
            { id: "WORKER_COMPLETED", label: "5. Chờ Nghiệm Thu", count: stats.workerDone },
            { id: "COMPLETED", label: "6. Đã Hoàn Tất", count: stats.completed },
            { id: "REJECTED", label: "7. Báo Giá Hỗ Trợ", count: stats.rejected },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer text-xs font-semibold shrink-0 ${statusFilter === tab.id
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-500 hover:bg-slate-50"
                }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold leading-none ${statusFilter === tab.id ? "bg-white/20 text-white" : "bg-slate-50 text-slate-900"
                  }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Search & Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs w-full">
        <div className="relative w-full sm:w-80 md:w-96">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo mã #, khách hàng, SĐT, địa chỉ, thợ..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium text-right sm:text-left">
          Tìm thấy <strong className="text-slate-900">{filteredClaims.length}</strong> phiếu bảo hành
        </div>
      </div>

      {/* Main Content Layout */}
      {loading ? (
        <div className="p-12 flex justify-center items-center min-h-[300px]">
          <LoadingSpinner />
        </div>
      ) : filteredClaims.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 space-y-3">
          <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto stroke-1" />
          <h3 className="font-bold text-slate-900 text-sm">Không có phiếu bảo hành nào</h3>
          <p className="text-xs text-slate-500">Không tìm thấy kết quả phù hợp với bộ lọc hiện tại.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden w-full">
          {/* DESKTOP / TABLET TABLE VIEW (hidden on mobile) */}
          <div className="hidden md:block w-full overflow-x-auto [&::-webkit-scrollbar]:h-1.5">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200 tracking-wider">
                  <th className="py-3 px-3.5">Mã Phiếu / Đơn</th>
                  <th className="py-3 px-3.5">Khách Hàng &amp; Công Trình</th>
                  <th className="py-3 px-3.5">Sự Cố Yêu Cầu</th>
                  <th className="py-3 px-3.5">Nhân Sự &amp; Quyết Toán</th>
                  <th className="py-3 px-3.5 text-center">Trạng Thái</th>
                  <th className="py-3 px-3.5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-900">
                {currentClaims.map((claim) => {
                  const customerImgs = claim.imageUrls ? claim.imageUrls.split(",").filter(Boolean) : [];
                  const isCustomerFault = claim.faultType === "CUSTOMER_FAULT" || Number(claim.finalSupportPrice) > 0 || Number(claim.suggestedPrice) > 0;
                  const supportPrice = Number(claim.finalSupportPrice) || Number(claim.suggestedPrice) || 0;
                  const isOldWorker = Boolean(
                    claim.technicianId &&
                    claim.previousTechnicianId &&
                    String(claim.technicianId) === String(claim.previousTechnicianId)
                  );

                  let defaultWorkerAmt = 200000;
                  if (claim.workerSalary != null) {
                    defaultWorkerAmt = Number(claim.workerSalary);
                  } else if (isCustomerFault) {
                    defaultWorkerAmt = supportPrice > 0 ? Math.round(supportPrice * 0.60) : 200000;
                  } else if (isOldWorker) {
                    defaultWorkerAmt = 0;
                  }

                  let defaultSurveyorAmt = 100000;
                  if (claim.surveyorSalary != null) {
                    defaultSurveyorAmt = Number(claim.surveyorSalary);
                  } else if (isCustomerFault) {
                    defaultSurveyorAmt = supportPrice > 0 ? Math.round(supportPrice * 0.10) : 100000;
                  }

                  const surAmt = claim.surveyorSalary != null ? Number(claim.surveyorSalary) : defaultSurveyorAmt;
                  const worAmt = claim.workerSalary != null ? Number(claim.workerSalary) : defaultWorkerAmt;

                  return (
                    <tr
                      key={claim.id}
                      className="hover:bg-slate-50 transition group"
                    >
                      {/* Cột 1: Mã Phiếu / Đơn hàng */}
                      <td className="py-3.5 px-3.5 align-top">
                        <div className="space-y-1">
                          <Link
                            to={`/admin/warranties/${claim.id}`}
                            className="font-bold text-slate-900 text-xs hover:text-slate-900 flex items-center gap-1 font-mono"
                          >
                            <span>Phiếu #{claim.id}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 transition shrink-0" />
                          </Link>
                          <Link
                            to={`/admin/bookings/${claim.bookingId}`}
                            className="text-[11px] text-slate-900 font-semibold hover:underline flex items-center gap-0.5 font-mono"
                          >
                            <span>Đơn #{claim.bookingId}</span>
                            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                          </Link>
                          <div className="text-[10px] text-slate-500">
                            {new Date(claim.createdAt).toLocaleDateString("vi-VN")}
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: Khách Hàng */}
                      <td className="py-3.5 px-3.5 align-top max-w-[200px]">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900 text-xs truncate">
                            {claim.customerName || "Khách hàng"}
                          </div>
                          <a
                            href={`tel:${claim.customerPhone}`}
                            className="text-[11px] text-slate-900 font-semibold hover:underline flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3 text-slate-900 shrink-0" />
                            <span>{claim.customerPhone || "Chưa có SĐT"}</span>
                          </a>
                          <div className="text-[11px] text-slate-500 truncate flex items-center gap-1" title={claim.address}>
                            <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                            <span className="truncate">{claim.address}</span>
                          </div>
                        </div>
                      </td>

                      {/* Cột 3: Sự Cố */}
                      <td className="py-3.5 px-3.5 align-top max-w-[220px]">
                        <div className="space-y-1">
                          <div className="font-bold text-slate-900 text-xs truncate" title={claim.issueTitle}>
                            {claim.issueTitle || "Yêu cầu bảo hành"}
                          </div>
                          <div className="text-[11px] text-slate-500 line-clamp-1" title={claim.description}>
                            {claim.description}
                          </div>
                          {customerImgs.length > 0 && (
                            <div className="flex gap-1 pt-0.5">
                              {customerImgs.slice(0, 3).map((img, i) => (
                                <img
                                  key={i}
                                  src={img}
                                  alt="Ảnh khách"
                                  onClick={() => setPreviewImage(img)}
                                  className="w-6 h-6 rounded-md object-cover border border-slate-200 cursor-pointer hover:scale-110 transition shrink-0"
                                />
                              ))}
                              {customerImgs.length > 3 && (
                                <span className="text-[10px] text-slate-500 self-center">
                                  +{customerImgs.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Cột 4: Nhân Sự & Quyết Toán */}
                      <td className="py-3.5 px-3.5 align-top min-w-[190px]">
                        <div className="space-y-1 text-[11px]">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="text-slate-500 shrink-0">GS:</span>
                            <span className="font-semibold text-slate-900 truncate max-w-[100px]">
                              {claim.surveyorName ? `@${claim.surveyorName}` : "Chưa gán"}
                            </span>
                            {claim.status === "COMPLETED" && (
                              claim.surveyorPaid ? (
                                <span className="text-[10px] bg-slate-50 text-slate-900 font-bold px-1.5 py-0.5 rounded border border-slate-200 leading-none shrink-0">
                                  ✓ {formatMoney(surAmt)}
                                </span>
                              ) : surAmt === 0 ? (
                                <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-1.5 py-0.5 rounded border border-slate-200 leading-none shrink-0">
                                  ✓ 0đ (Trách nhiệm)
                                </span>
                              ) : (
                                <span className="text-[10px] bg-slate-50 text-slate-900 font-semibold px-1.5 py-0.5 rounded border border-slate-200 leading-none shrink-0">
                                  Chờ chi ({formatMoney(surAmt)})
                                </span>
                              )
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="text-slate-500 shrink-0">Thợ:</span>
                            <span className="font-semibold text-slate-900 truncate max-w-[100px]">
                              {claim.technicianName ? `@${claim.technicianName}` : claim.status === "TECHNICIAN_REJECTED" ? "⚠ Từ chối" : "Chưa gán"}
                            </span>
                            {claim.status === "COMPLETED" && (
                              claim.workerPaid ? (
                                <span className="text-[10px] bg-slate-50 text-slate-900 font-bold px-1.5 py-0.5 rounded border border-slate-200 leading-none shrink-0">
                                  ✓ {formatMoney(worAmt)}
                                </span>
                              ) : worAmt === 0 ? (
                                <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-1.5 py-0.5 rounded border border-slate-200 leading-none shrink-0">
                                  ✓ 0đ (Trách nhiệm)
                                </span>
                              ) : (
                                <span className="text-[10px] bg-slate-50 text-slate-900 font-semibold px-1.5 py-0.5 rounded border border-slate-200 leading-none shrink-0">
                                  Chờ chi ({formatMoney(worAmt)})
                                </span>
                              )
                            )}
                          </div>
                          {claim.status === "COMPLETED" && 
                            ((claim.surveyorId && !claim.surveyorPaid && surAmt > 0) || (claim.technicianId && !claim.workerPaid && worAmt > 0)) && (
                            <Link
                              to={`/admin/payments?tab=STAFF&subTab=WARRANTY&claimId=${claim.id}&search=${claim.id}`}
                              className="inline-flex items-center gap-1 text-[10.5px] text-slate-900 font-bold hover:underline pt-0.5"
                            >
                              <QrCode className="w-2.5 h-2.5 text-slate-900 shrink-0" />
                              <span>Quyết toán VietQR ➔</span>
                            </Link>
                          )}
                        </div>
                      </td>

                      {/* Cột 5: Trạng Thái */}
                      <td className="py-3.5 px-3.5 align-top text-center whitespace-nowrap">
                        {getStatusBadge(claim.status)}
                      </td>

                      {/* Cột 6: Thao Tác Chi Tiết */}
                      <td className="py-3.5 px-3.5 align-top text-right whitespace-nowrap">
                        <Link
                          to={`/admin/warranties/${claim.id}`}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-600 text-white font-semibold rounded-lg text-xs transition inline-flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
                        >
                          <Eye className="w-3.5 h-3.5 shrink-0" />
                          <span>Chi Tiết</span>
                          <ArrowRight className="w-3 h-3 shrink-0" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARDS VIEW (md:hidden) */}
          <div className="md:hidden divide-y divide-slate-100">
            {currentClaims.map((claim) => {
              const customerImgs = claim.imageUrls ? claim.imageUrls.split(",").filter(Boolean) : [];
              return (
                <div key={claim.id} className="p-4 space-y-3 bg-white hover:bg-slate-50 transition">
                  {/* Row 1: Header */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        BH #{claim.id}
                      </span>
                      <Link
                        to={`/admin/bookings/${claim.bookingId}`}
                        className="text-[11px] text-slate-900 font-bold hover:underline flex items-center gap-0.5"
                      >
                        <span>Đơn #{claim.bookingId}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </Link>
                    </div>
                    <div>{getStatusBadge(claim.status)}</div>
                  </div>

                  {/* Row 2: Customer Box */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-900" />
                        <span>{claim.customerName || "Khách hàng"}</span>
                      </div>
                      <a
                        href={`tel:${claim.customerPhone}`}
                        className="text-slate-900 font-semibold text-[11px] hover:underline flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs"
                      >
                        <Phone className="w-3 h-3 text-slate-900" />
                        <span>{claim.customerPhone || "SĐT"}</span>
                      </a>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-start gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{claim.address}</span>
                    </div>
                  </div>

                  {/* Row 3: Issue */}
                  <div className="text-xs space-y-1">
                    <div className="font-bold text-slate-900 line-clamp-1">{claim.issueTitle || "Yêu cầu bảo hành"}</div>
                    {claim.description && (
                      <p className="text-[11px] text-slate-500 line-clamp-2">{claim.description}</p>
                    )}
                    {customerImgs.length > 0 && (
                      <div className="flex gap-1.5 pt-1 overflow-x-auto scrollbar-none">
                        {customerImgs.map((img, i) => (
                          <img
                            key={i}
                            src={img}
                            alt="Ảnh khách"
                            onClick={() => setPreviewImage(img)}
                            className="w-12 h-12 rounded-lg object-cover border border-slate-200 cursor-pointer shrink-0"
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Row 4: Staff Info */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-200">
                    <div className="space-y-0.5">
                      <span className="text-slate-500 block text-[10px]">Giám Sát:</span>
                      {claim.surveyorName ? (
                        <strong className="text-slate-900 block truncate">{claim.surveyorName}</strong>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openAssignSurveyorModal(claim)}
                          className="text-slate-900 font-semibold text-xs hover:underline cursor-pointer"
                        >
                          + Phân GS
                        </button>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-slate-500 block text-[10px]">Đội Thợ:</span>
                      {claim.technicianName ? (
                        <strong className="text-slate-900 block truncate">{claim.technicianName}</strong>
                      ) : (
                        <span className="text-slate-500 italic block">Chưa phân</span>
                      )}
                    </div>
                  </div>

                  {/* Row 5: Action Button */}
                  <div className="pt-1">
                    <Link
                      to={`/admin/warranties/${claim.id}`}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-600 text-white font-semibold rounded-lg text-xs transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem Chi Tiết &amp; Xử Lý</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-slate-200 bg-slate-50">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredClaims.length}
              itemsPerPage={itemsPerPage}
            />
          </div>
        </div>
      )}

      {/* MODAL 1: PHÂN CÔNG GIÁM SÁT KHẢO SÁT */}
      {assignSurveyorModal && (
        <Modal
          isOpen={Boolean(assignSurveyorModal)}
          onClose={() => setAssignSurveyorModal(null)}
          title={`Phân Công Giám Sát Khảo Sát #${assignSurveyorModal.id}`}
          size="lg"
        >
          <form onSubmit={handleAssignSurveyorSubmit} className="space-y-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-900 space-y-1.5">
              <div className="font-bold flex items-center gap-1 text-slate-900">
                <UserCheck className="w-4 h-4 text-slate-900" />
                <span>Hướng dẫn phân công Giám Sát Khảo Sát:</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-900">
                • Giám Sát sẽ đến công trình kiểm tra nguyên nhân màng sơn, đo độ ẩm, chụp ảnh hiện trường và lập biên bản thẩm định.
                <br />
                • Hệ thống ưu tiên Giám sát cùng khu vực ({assignSurveyorModal.address || "Hà Nội"}) để tối ưu thời gian di chuyển.
              </p>
            </div>

            {/* Filter Tabs & Search */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                <div className="flex gap-1">
                  {[
                    { id: "all", label: `Tất cả (${surveyors.length})` },
                    { id: "district", label: "★ Cùng khu vực" },
                    { id: "idle", label: "⚡ Đang rảnh / Hoạt động" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSupervisorModalTab(tab.id)}
                      className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition cursor-pointer ${supervisorModalTab === tab.id
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-slate-50 text-slate-500 hover:bg-slate-50"
                        }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  placeholder="Tìm tên, SĐT, khu vực..."
                  value={supervisorSearch}
                  onChange={(e) => setSupervisorSearch(e.target.value)}
                  className="px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-200 text-[11px] w-40 focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              {/* Danh sách giám sát dạng thẻ */}
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {filteredSupervisors.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-xs">
                    Không tìm thấy Giám Sát phù hợp theo bộ lọc
                  </div>
                ) : (
                  filteredSupervisors.map((s) => {
                    const sId = String(s.userId || s.id);
                    const isSelected = selectedSurveyorId === sId;
                    const claimAddress = (assignSurveyorModal.address || "").toLowerCase();
                    const sArea = (s.serviceArea || s.address || "").toLowerCase();
                    const isDistrictMatch =
                      sArea &&
                      claimAddress &&
                      (claimAddress.includes(sArea) ||
                        sArea.split(",").some((part) => claimAddress.includes(part.trim())));

                    return (
                      <div
                        key={sId}
                        onClick={() => setSelectedSurveyorId(sId)}
                        className={`p-3 rounded-lg border transition cursor-pointer flex items-center justify-between gap-3 ${isSelected
                            ? "border-blue-600 bg-slate-50 ring-1 ring-[#1E3A8A] shadow-xs"
                            : "border-slate-200 bg-white hover:border-slate-200 hover:bg-slate-50"
                          }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {s.avatar ? (
                            <img
                              src={s.avatar}
                              alt={s.username}
                              className="w-9 h-9 rounded-md object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div
                              className={`w-9 h-9 rounded-md flex items-center justify-center font-bold text-xs shrink-0 ${isSelected ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-900"
                                }`}
                            >
                              {(s.username || s.fullName || "S").charAt(0).toUpperCase()}
                            </div>
                          )}

                          <div className="space-y-0.5 min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-xs truncate">
                                @{s.username} {s.fullName ? `(${s.fullName})` : ""}
                              </span>

                              {isDistrictMatch && (
                                <span className="text-[10px] font-semibold bg-slate-50 text-slate-900 px-1.5 py-0.2 rounded shrink-0">
                                  ★ Cùng khu vực
                                </span>
                              )}
                            </div>

                            <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                              <span>SĐT: <strong className="text-slate-900">{s.phoneNumber || "Chưa có"}</strong></span>
                              <span>Khu vực: <strong className="text-slate-900">{s.serviceArea || "Hà Nội"}</strong></span>
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0">
                          <input
                            type="radio"
                            name="surveyorSelectManagement"
                            checked={isSelected}
                            onChange={() => setSelectedSurveyorId(sId)}
                            className="w-4 h-4 text-slate-900 focus:ring-blue-500/20 focus:border-blue-600 cursor-pointer"
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-slate-900">Ghi chú chỉ đạo của Admin</label>
              <textarea
                rows={2}
                value={surveyorAdminNote}
                onChange={(e) => setSurveyorAdminNote(e.target.value)}
                placeholder="Ví dụ: Khách phản ánh bong tróc, mang theo máy đo độ ẩm và bảng màu sơn gốc..."
                className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setAssignSurveyorModal(null)}
                className="px-4 py-2 bg-slate-50 hover:bg-slate-50 text-slate-900 font-semibold rounded-lg transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submittingSurveyor}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-600 text-white font-semibold rounded-lg transition cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
              >
                <UserCheck className="w-4 h-4" />
                <span>{submittingSurveyor ? "Đang gán..." : "Xác Nhận Phân Công"}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Lightbox Preview */}
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


