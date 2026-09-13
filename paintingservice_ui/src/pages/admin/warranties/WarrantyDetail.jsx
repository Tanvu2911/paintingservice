import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link, useOutletContext } from "react-router-dom";

import AxiosConfig from "../../../util/AxiosConfig";
import DashboardHeader from "../../../components/layout/DashboardHeader";
import LoadingSpinner from "../../../components/common/LoadingSpinner";
import ImageLightboxModal from "../../../components/common/ImageLightboxModal";
import Modal from "../../../components/common/Modal";
import { formatMoney } from "../../../util/formatters";

// Subcomponents
import AssignWarrantySurveyorModal from "./components/AssignWarrantySurveyorModal";
import AssignWarrantyTechnicianModal from "./components/AssignWarrantyTechnicianModal";
import WarrantyRejectSupportModal from "./components/WarrantyRejectSupportModal";
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  Wrench,
  XCircle,
  AlertTriangle,
  User,
  Phone,
  Calendar,
  ExternalLink,
  MapPin,
  Image as ImageIcon,
  ClipboardCheck,
  Package,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  DollarSign,
  UserCheck,
  QrCode,
  CreditCard,
  Check,
  Send,
  Sparkles,
  Info,
  Layers,
  Award,
  RefreshCw,
  Pencil,
} from "lucide-react";

export default function WarrantyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, showToast } = useOutletContext() || {};

  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [surveyors, setSurveyors] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);

  // Modal 1: Phân công Giám sát
  const [assignSurveyorModal, setAssignSurveyorModal] = useState(false);
  const [selectedSurveyorId, setSelectedSurveyorId] = useState("");
  const [surveyorNote, setSurveyorNote] = useState("");
  const [supervisorModalTab, setSupervisorModalTab] = useState("all");
  const [supervisorSearch, setSupervisorSearch] = useState("");
  const [submittingSurveyor, setSubmittingSurveyor] = useState(false);

  // Modal 2: Phân công Thợ
  const [assignTechnicianModal, setAssignTechnicianModal] = useState(false);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState("");
  const [technicianNote, setTechnicianNote] = useState("");
  const [workerSalary, setWorkerSalary] = useState("");
  const [techTab, setTechTab] = useState("all");
  const [techSearch, setTechSearch] = useState("");
  const [submittingTechnician, setSubmittingTechnician] = useState(false);

  // Modal 3: Từ chối & Báo giá hỗ trợ
  const [rejectModal, setRejectModal] = useState(false);
  const [supportPrice, setSupportPrice] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [submittingReject, setSubmittingReject] = useState(false);

  // Modal 4: Chỉnh sửa tiền công thợ / giám sát trực tiếp
  const [editSalaryModal, setEditSalaryModal] = useState(false);
  const [editWorkerSalary, setEditWorkerSalary] = useState("");
  const [editSurveyorSalary, setEditSurveyorSalary] = useState("");
  const [submittingEditSalary, setSubmittingEditSalary] = useState(false);

  const fetchClaimDetail = async () => {
    try {
      setLoading(true);
      const res = await AxiosConfig.get(`/warranty-claims/${id}`);
      setClaim(res.data);
    } catch (err) {
      console.error("Lỗi khi tải chi tiết bảo hành:", err);
      showToast?.("Không tìm thấy thông tin phiếu bảo hành!", "error");
    } finally {
      setLoading(false);
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
            String(s.staffType || "").toUpperCase() === "SUPERVISOR" ||
            String(s.staffType || "").toUpperCase() === "SURVEYOR" ||
            String(s.role || "").toUpperCase().includes("SURVEY") ||
            String(s.role || "").toUpperCase().includes("SUPERVISOR") ||
            String(s.roleName || "").toUpperCase().includes("SURVEY") ||
            String(s.roleName || "").toUpperCase().includes("SUPERVISOR")
        );
        rawWorker = list.filter(
          (s) =>
            String(s.staffType || "").toUpperCase() === "WORKER" ||
            String(s.staffType || "").toUpperCase() === "TECHNICIAN" ||
            String(s.role || "").toUpperCase().includes("TECH") ||
            String(s.role || "").toUpperCase().includes("WORKER") ||
            !s.staffType
        );
      }

      setSurveyors(rawSup);
      setTechnicians(rawWorker);
    } catch (err) {
      console.error("Lỗi tải danh sách nhân viên:", err);
    }
  };

  useEffect(() => {
    fetchClaimDetail();
    fetchStaff();
  }, [id]);

  const handleAssignSurveyorSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSurveyorId) {
      showToast?.("Vui lòng chọn Giám Sát phụ trách!", "warning");
      return;
    }
    setSubmittingSurveyor(true);
    try {
      await AxiosConfig.put(`/warranty-claims/${id}/assign-surveyor`, {
        surveyorId: Number(selectedSurveyorId),
        adminNote: surveyorNote,
      });
      showToast?.("Đã phân công Giám Sát đi khảo sát thành công!", "success");
      setAssignSurveyorModal(false);
      fetchClaimDetail();
    } catch (err) {
      showToast?.(err.response?.data?.message || "Phân công thất bại!", "error");
    } finally {
      setSubmittingSurveyor(false);
    }
  };

  const openAssignTechnicianModal = (techId = "", note = "") => {
    setSelectedTechnicianId(techId);
    setTechnicianNote(note);
    if (claim?.workerSalary != null) {
      setWorkerSalary(String(claim.workerSalary));
    } else if (claim?.faultType === "CUSTOMER_FAULT" || Number(claim?.finalSupportPrice) > 0 || Number(claim?.suggestedPrice) > 0) {
      const sp = Number(claim?.finalSupportPrice) || Number(claim?.suggestedPrice) || 0;
      setWorkerSalary(sp > 0 ? String(Math.round(sp * 0.6)) : "200000");
    } else if (techId && claim?.previousTechnicianId && String(techId) === String(claim.previousTechnicianId)) {
      setWorkerSalary("0");
    } else {
      setWorkerSalary("200000");
    }
    setAssignTechnicianModal(true);
  };

  const handleAssignTechnicianSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTechnicianId) {
      showToast?.("Vui lòng chọn Đội Thợ thi công!", "warning");
      return;
    }
    setSubmittingTechnician(true);
    try {
      await AxiosConfig.put(`/warranty-claims/${id}/assign-technician`, {
        technicianId: Number(selectedTechnicianId),
        adminNote: technicianNote,
        workerSalary: workerSalary !== "" ? Number(workerSalary) : undefined,
      });
      showToast?.("Đã duyệt phân Đội Thợ & thiết lập tiền công thành công!", "success");
      setAssignTechnicianModal(false);
      fetchClaimDetail();
    } catch (err) {
      showToast?.(err.response?.data?.message || "Phân thợ thất bại!", "error");
    } finally {
      setSubmittingTechnician(false);
    }
  };

  const handleUpdateSalariesSubmit = async (e) => {
    e.preventDefault();
    setSubmittingEditSalary(true);
    try {
      await AxiosConfig.put(`/warranty-claims/${id}/update-salaries`, {
        workerSalary: editWorkerSalary !== "" ? Number(editWorkerSalary) : undefined,
        surveyorSalary: editSurveyorSalary !== "" ? Number(editSurveyorSalary) : undefined,
      });
      showToast?.("Đã cập nhật tiền công nhân sự thành công!", "success");
      setEditSalaryModal(false);
      fetchClaimDetail();
    } catch (err) {
      showToast?.(err.response?.data?.message || "Cập nhật tiền công thất bại!", "error");
    } finally {
      setSubmittingEditSalary(false);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    setSubmittingReject(true);
    try {
      const res = await AxiosConfig.put(`/warranty-claims/${id}/reject-with-support`, {
        supportPrice: supportPrice ? Number(supportPrice) : 0,
        adminNote: rejectReason,
      });
      showToast?.(res.data?.message || "Đã gửi phản hồi từ chối & báo giá hỗ trợ cho khách hàng!", "success");
      setRejectModal(false);
      fetchClaimDetail();
    } catch (err) {
      showToast?.(err.response?.data?.message || "Thao tác thất bại!", "error");
    } finally {
      setSubmittingReject(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="px-2.5 py-1 rounded text-xs font-semibold bg-slate-50 text-slate-900 border border-slate-200 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-900" /> 1. Chờ Phân Giám Sát
          </span>
        );
      case "SURVEY_ASSIGNED":
        return (
          <span className="px-2.5 py-1 rounded text-xs font-semibold bg-slate-50 text-slate-900 border border-slate-200 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-slate-900" /> 2. Đang Khảo Sát Hiện Trường
          </span>
        );
      case "SURVEYED":
        return (
          <span className="px-2.5 py-1 rounded text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200 flex items-center gap-1.5">
            <ClipboardCheck className="w-3.5 h-3.5 text-purple-600" /> 3. Đã Có Báo Cáo Khảo Sát
          </span>
        );
      case "CUSTOMER_ACCEPTED_SUPPORT":
        return (
          <span className="px-2.5 py-1 rounded text-xs font-semibold bg-slate-50 text-slate-900 border border-slate-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-slate-900" /> 3b. Khách Đã Đồng Ý Giá Hỗ Trợ
          </span>
        );
      case "TECHNICIAN_REJECTED":
        return (
          <span className="px-2.5 py-1 rounded text-xs font-semibold bg-slate-50 text-slate-900 border border-slate-200 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-slate-500" /> 4b. Thợ Từ Chối (Cần Phân Thợ Khác)
          </span>
        );
      case "WORKER_ASSIGNED":
        return (
          <span className="px-2.5 py-1 rounded text-xs font-semibold bg-slate-50 text-slate-900 border border-slate-200 flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5 text-slate-500" /> 4. Đã Phân Thợ (Chờ Thợ Làm)
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="px-2.5 py-1 rounded text-xs font-semibold bg-slate-50 text-slate-900 border border-slate-200 flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5 text-slate-900 animate-spin" /> 4. Thợ Đang Thi Công Dặm Vá
          </span>
        );
      case "WORKER_COMPLETED":
        return (
          <span className="px-2.5 py-1 rounded text-xs font-semibold bg-orange-50 text-orange-800 border border-orange-200 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-orange-600" /> 5. Thợ Xong - Chờ Giám Sát Nghiệm Thu
          </span>
        );
      case "COMPLETED":
        return (
          <span className="px-2.5 py-1 rounded text-xs font-semibold bg-slate-50 text-slate-900 border border-slate-200 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" /> 6. Đã Nghiệm Thu &amp; Hoàn Tất
          </span>
        );
      case "REJECTED":
        return (
          <span className="px-2.5 py-1 rounded text-xs font-semibold bg-slate-50 text-slate-900 border border-slate-200 flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5 text-slate-500" /> 7. Đã Báo Giá Hỗ Trợ (Chờ Khách)
          </span>
        );
      case "CANCELLED":
        return (
          <span className="px-2.5 py-1 rounded text-xs font-semibold bg-slate-50 text-slate-900 border border-slate-200 flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5 text-slate-500" /> Đã Hủy / Đã Đóng
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded text-xs font-semibold bg-slate-50 text-slate-900 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  const getStepProgress = (status) => {
    switch (status) {
      case "PENDING":
        return 1;
      case "SURVEY_ASSIGNED":
        return 2;
      case "SURVEYED":
      case "CUSTOMER_ACCEPTED_SUPPORT":
      case "TECHNICIAN_REJECTED":
      case "REJECTED":
        return 3;
      case "WORKER_ASSIGNED":
      case "IN_PROGRESS":
        return 4;
      case "WORKER_COMPLETED":
        return 5;
      case "COMPLETED":
        return 6;
      default:
        return 1;
    }
  };

  const filteredSupervisors = useMemo(() => {
    const claimAddress = (claim?.address || "").toLowerCase();
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
  }, [surveyors, supervisorSearch, supervisorModalTab, claim?.address]);

  const filteredTechnicians = useMemo(() => {
    const claimAddress = (claim?.address || "").toLowerCase();
    const prevTechId = claim?.previousTechnicianId ? String(claim.previousTechnicianId) : "";

    return technicians.filter((tech) => {
      const techId = String(tech.userId || tech.id);
      const techName = (tech.username || tech.fullName || "").toLowerCase();
      const techPhone = (tech.phoneNumber || "").toLowerCase();
      const techArea = (tech.serviceArea || tech.address || "").toLowerCase();
      const s = techSearch.toLowerCase().trim();
      const matchSearch = !s || techName.includes(s) || techPhone.includes(s) || techArea.includes(s);

      if (techTab === "area") {
        const isPrevTech = prevTechId && techId === prevTechId;
        const isDistrictMatch =
          techArea &&
          claimAddress &&
          (claimAddress.includes(techArea) ||
            techArea.split(",").some((part) => claimAddress.includes(part.trim())));
        return matchSearch && (isPrevTech || isDistrictMatch);
      }
      if (techTab === "available") {
        return matchSearch && tech.available !== false && tech.status !== "BUSY";
      }
      return matchSearch;
    });
  }, [technicians, techSearch, techTab, claim?.address, claim?.previousTechnicianId]);

  if (loading) {
    return (
      <div className="p-12 flex justify-center items-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="p-8 text-center space-y-4 bg-white rounded-lg border border-slate-200">
        <AlertTriangle className="w-12 h-12 text-slate-900 mx-auto stroke-1" />
        <h2 className="text-lg font-bold text-slate-900">Không tìm thấy thông tin bảo hành</h2>
        <button
          onClick={() => navigate("/admin/warranties")}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-600 text-white font-semibold rounded-lg text-xs cursor-pointer shadow-xs"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const customerImages = claim.imageUrls ? claim.imageUrls.split(",").filter(Boolean) : [];
  const surveyImages = claim.surveyImages ? claim.surveyImages.split(",").filter(Boolean) : [];
  const resolvedImages = claim.resolvedImageUrls ? claim.resolvedImageUrls.split(",").filter(Boolean) : [];
  const stepCurrent = getStepProgress(claim.status);

  // Tính thù lao thông minh cho Thợ & Giám sát
  const isCustomerFault = claim.faultType === "CUSTOMER_FAULT" || Number(claim.finalSupportPrice) > 0 || Number(claim.suggestedPrice) > 0;
  const claimSupportPrice = Number(claim.finalSupportPrice) || Number(claim.suggestedPrice) || 0;
  const isOldWorker = Boolean(
    claim.technicianId &&
    claim.previousTechnicianId &&
    String(claim.technicianId) === String(claim.previousTechnicianId)
  );

  let defaultWorkerAmt = 200000;
  let workerDesc = "Thợ mới (Công ty chi)";
  if (claim.workerSalary != null) {
    defaultWorkerAmt = Number(claim.workerSalary);
    workerDesc = "Admin đã ấn định";
  } else if (isCustomerFault) {
    defaultWorkerAmt = claimSupportPrice > 0 ? Math.round(claimSupportPrice * 0.60) : 200000;
    workerDesc = claimSupportPrice > 0 ? `Hưởng 60% tiền khách (${formatMoney(defaultWorkerAmt)})` : "Lỗi khách quan";
  } else if (isOldWorker) {
    defaultWorkerAmt = 0;
    workerDesc = "Thợ cũ (0đ - Trách nhiệm)";
  }

  let defaultSurveyorAmt = 100000;
  let surveyorDesc = "Định mức công ty";
  if (claim.surveyorSalary != null) {
    defaultSurveyorAmt = Number(claim.surveyorSalary);
    surveyorDesc = "Admin đã ấn định";
  } else if (isCustomerFault) {
    defaultSurveyorAmt = claimSupportPrice > 0 ? Math.round(claimSupportPrice * 0.10) : 100000;
    surveyorDesc = claimSupportPrice > 0 ? `Hưởng 10% tiền khách (${formatMoney(defaultSurveyorAmt)})` : "Lỗi khách quan";
  }

  const surAmt = claim.surveyorSalary != null ? Number(claim.surveyorSalary) : defaultSurveyorAmt;
  const worAmt = claim.workerSalary != null ? Number(claim.workerSalary) : defaultWorkerAmt;

  return (
    <div className="space-y-4 pb-16">
      {/* Top Header: Unified Navigation, Title, Badges & Actions */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <button
              onClick={() => navigate("/admin/warranties")}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition cursor-pointer shrink-0 mt-0.5 sm:mt-0"
              title="Quay lại danh sách"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-none">
                  Phiếu Bảo Hành #{claim.id}
                </h1>
                <Link
                  to={`/admin/bookings/${claim.bookingId}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                  title="Mở đơn hàng gốc"
                >
                  <span>Đơn #{claim.bookingId}</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                  {claim.warrantyYears ? `${claim.warrantyYears} năm BH` : "2 năm BH"}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Gửi lúc: {new Date(claim.createdAt).toLocaleString("vi-VN")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-end md:self-auto">
            {getStatusBadge(claim.status)}
            <Link
              to={`/admin/bookings/${claim.bookingId}`}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg text-xs transition flex items-center gap-1.5 border border-slate-200"
            >
              <span>Xem Đơn Hàng</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          </div>
        </div>

        {/* Compact Stepper Timeline */}
        <div className="mt-4 pt-3.5 border-t border-slate-100">
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
            {[
              { step: 1, label: "Tiếp Nhận" },
              { step: 2, label: "Khảo Sát" },
              { step: 3, label: "Duyệt & Phân Thợ" },
              { step: 4, label: "Thi Công" },
              { step: 5, label: "Nghiệm Thu" },
            ].map((item) => {
              const isDone = stepCurrent > item.step;
              const isCurrent = stepCurrent === item.step;
              return (
                <div
                  key={item.step}
                  className={`flex items-center gap-1.5 p-2 rounded-lg text-xs font-medium transition ${
                    isDone
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : isCurrent
                      ? "bg-blue-50 text-blue-800 font-bold border border-blue-200 shadow-2xs"
                      : "bg-slate-50 text-slate-400 border border-slate-200/60"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      isDone
                        ? "bg-emerald-600 text-white"
                        : isCurrent
                        ? "bg-blue-600 text-white"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {isDone ? <Check className="w-2.5 h-2.5 stroke-3" /> : item.step}
                  </div>
                  <span className="truncate">{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Grid: 2 Cột */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 items-start">
        {/* CỘT TRÁI (2/3): YÊU CẦU KHÁCH HÀNG & BÁO CÁO KHẢO SÁT */}
        <div className="lg:col-span-2 space-y-4">
          {/* Card 1: Yêu Cầu Của Khách Hàng */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-slate-700" />
                <span>Yêu Cầu Của Khách Hàng</span>
              </h3>
              {claim.issueType && (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  {claim.issueType === "BONG_TROC"
                    ? "Bong tróc màng sơn"
                    : claim.issueType === "THAM_NUOC"
                    ? "Thấm ố / Ẩm mốc"
                    : claim.issueType === "NUT_NE"
                    ? "Nứt nẻ chân chim"
                    : claim.issueType || "Sự cố kỹ thuật"}
                </span>
              )}
            </div>

            {/* Thông tin liên hệ & Công trình (Gọn gàng trong 1 khối) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
              <div className="space-y-0.5">
                <span className="text-[11px] text-slate-500">Khách hàng:</span>
                <div className="flex items-center gap-2">
                  <strong className="text-slate-900 font-bold">{claim.customerName || "Khách hàng"}</strong>
                  {claim.customerPhone && (
                    <a
                      href={`tel:${claim.customerPhone}`}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 transition"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{claim.customerPhone}</span>
                    </a>
                  )}
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-[11px] text-slate-500">Địa chỉ công trình:</span>
                <div className="flex items-start gap-1 text-slate-800 font-medium line-clamp-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                  <span>{claim.address || "Chưa cập nhật địa chỉ"}</span>
                </div>
              </div>

              {claim.preferredDate && (
                <div className="sm:col-span-2 pt-1.5 border-t border-slate-200 flex items-center gap-2 text-slate-700">
                  <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>
                    Lịch hẹn mong muốn: <strong>{new Date(claim.preferredDate).toLocaleDateString("vi-VN")}</strong> {claim.preferredTime ? `(${claim.preferredTime})` : ""}
                  </span>
                </div>
              )}
            </div>

            {/* Chi tiết sự cố */}
            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-900 text-sm">
                {claim.issueTitle || "Yêu cầu kiểm tra & dặm vá sơn"}
              </h4>
              {claim.description ? (
                <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200 italic">
                  "{claim.description}"
                </p>
              ) : (
                <p className="text-slate-400 italic">Khách hàng không cung cấp thêm mô tả chi tiết.</p>
              )}

              {/* Ảnh sự cố */}
              {customerImages.length > 0 && (
                <div className="pt-2">
                  <span className="text-slate-500 font-semibold block text-[11px] mb-1.5">
                    Ảnh sự cố do khách gửi ({customerImages.length} ảnh):
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {customerImages.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt={`Khách gửi ${i + 1}`}
                        onClick={() => setPreviewImage(img)}
                        className="w-full h-20 rounded-lg object-cover border border-slate-200 cursor-pointer hover:opacity-85 transition shadow-2xs"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Báo Cáo Khảo Sát Hiện Trường */}
          {claim.surveyNote ? (
            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-slate-700" />
                  <span>Báo Cáo Khảo Sát Thẩm Định</span>
                </h3>
                {claim.faultType === "COMPANY_FAULT" ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-200 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Lỗi Kỹ Thuật (Bảo hành 0đ)
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 font-bold text-xs border border-purple-200 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Lỗi Khách Quan ({claimSupportPrice > 0 ? `Báo giá: ${formatMoney(claimSupportPrice)}` : "Chờ chốt giá"})
                  </span>
                )}
              </div>

              <div className="space-y-2.5 text-xs">
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">Đánh giá nguyên nhân hiện trường:</span>
                  <p className="text-slate-800 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                    {claim.surveyNote}
                  </p>
                </div>

                {claim.materialNote && (
                  <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-200 text-xs space-y-1">
                    <strong className="flex items-center gap-1.5 text-blue-900 text-[11px]">
                      <Package className="w-3.5 h-3.5 text-blue-700" />
                      <span>Vật tư &amp; Sơn chuẩn bị cho Thợ:</span>
                    </strong>
                    <p className="text-slate-800 pl-5 leading-relaxed">
                      {claim.materialNote}
                    </p>
                  </div>
                )}

                {surveyImages.length > 0 && (
                  <div className="pt-1">
                    <span className="text-slate-500 font-semibold block text-[11px] mb-1.5">
                      Ảnh khảo sát đo đạc ({surveyImages.length} ảnh):
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {surveyImages.map((img, i) => (
                        <img
                          key={i}
                          src={img}
                          alt={`Khảo sát ${i + 1}`}
                          onClick={() => setPreviewImage(img)}
                          className="w-full h-20 rounded-lg object-cover border border-slate-200 cursor-pointer hover:opacity-85 transition shadow-2xs"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-xl border border-dashed border-slate-200 p-5 text-center text-xs text-slate-500 space-y-1">
              <ClipboardCheck className="w-6 h-6 mx-auto text-slate-400 stroke-1" />
              <p className="font-semibold text-slate-700">Chưa có biên bản khảo sát hiện trường</p>
              <p className="text-[11px] text-slate-400">Giám Sát sẽ kiểm tra và lập báo cáo nguyên nhân sau khi được phân công.</p>
            </div>
          )}

          {/* Card 3: Ảnh Nghiệm Thu Sau Thi Công */}
          {resolvedImages.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Hình Ảnh Nghiệm Thu Sau Khi Hoàn Tất</span>
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold text-[11px] border border-emerald-200">
                  ✓ Đạt chuẩn
                </span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {resolvedImages.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt={`Nghiệm thu ${i + 1}`}
                    onClick={() => setPreviewImage(img)}
                    className="w-full h-20 rounded-lg object-cover border border-slate-200 cursor-pointer hover:opacity-85 transition shadow-2xs"
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CỘT PHẢI (1/3): HÀNH ĐỘNG TIẾP THEO & NHÂN SỰ/THÙ LAO */}
        <div className="space-y-4 lg:sticky lg:top-4">
          {/* Card 1: Hành Động Tiếp Theo */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-3.5">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-3">
              <Sparkles className="w-4 h-4 text-slate-700" />
              <span>Hành Động Tiếp Theo</span>
            </h3>

            {/* 1. Trạng thái PENDING: Phân Giám sát */}
            {claim.status === "PENDING" && (
              <div className="space-y-3">
                <div className="p-2.5 bg-amber-50 text-amber-900 rounded-lg border border-amber-200 text-xs">
                  Khách mới gửi yêu cầu. Vui lòng gán 1 Giám Sát đến khảo sát.
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSurveyorId("");
                    setSurveyorNote("");
                    setAssignSurveyorModal(true);
                  }}
                  className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <UserCheck className="w-4 h-4 shrink-0" />
                  <span>Phân Công Giám Sát Khảo Sát</span>
                </button>
              </div>
            )}

            {/* 2. Trạng thái SURVEY_ASSIGNED: Đang chờ khảo sát */}
            {claim.status === "SURVEY_ASSIGNED" && (
              <div className="space-y-3">
                <div className="p-2.5 bg-blue-50 text-blue-900 rounded-lg border border-blue-200 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Giám sát đang thẩm định
                  </div>
                  <p className="text-[11px] text-blue-800">
                    Phụ trách: <strong>{claim.surveyorName}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSurveyorId(claim.surveyorId ? String(claim.surveyorId) : "");
                    setSurveyorNote(claim.adminNote || "");
                    setAssignSurveyorModal(true);
                  }}
                  className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg text-xs transition cursor-pointer"
                >
                  Đổi Giám Sát Khác
                </button>
              </div>
            )}

            {/* 3. Trạng thái SURVEYED: Đã có báo cáo, Admin duyệt */}
            {claim.status === "SURVEYED" && (
              <div className="space-y-3">
                {claim.faultType === "COMPANY_FAULT" ? (
                  <>
                    <div className="p-2.5 bg-emerald-50 text-emerald-900 rounded-lg border border-emerald-200 text-xs">
                      ✓ Đã xác nhận <strong>Lỗi Kỹ Thuật (0đ)</strong>. Duyệt phân thợ dặm vá.
                    </div>
                    <button
                      type="button"
                      onClick={() => openAssignTechnicianModal("", "")}
                      className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <Wrench className="w-4 h-4 shrink-0" />
                      <span>Duyệt &amp; Phân Đội Thợ Khắc Phục</span>
                    </button>
                  </>
                ) : (
                  <>
                    <div className="p-2.5 bg-purple-50 text-purple-900 rounded-lg border border-purple-200 text-xs space-y-1">
                      <div>⚠ Thẩm định <strong>Lỗi Khách Quan</strong></div>
                      <div className="text-[11px] text-purple-800">
                        Giá đề xuất: <strong>{formatMoney(claim.suggestedPrice || 0)}</strong>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSupportPrice(claim.suggestedPrice ? String(claim.suggestedPrice) : "");
                        setRejectReason(claim.surveyNote || "");
                        setRejectModal(true);
                      }}
                      className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <Send className="w-4 h-4 shrink-0" />
                      <span>Gửi Báo Giá Sửa Chữa Hỗ Trợ</span>
                    </button>
                  </>
                )}
              </div>
            )}

            {/* 3b. Trạng thái CUSTOMER_ACCEPTED_SUPPORT */}
            {claim.status === "CUSTOMER_ACCEPTED_SUPPORT" && (
              <div className="space-y-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-900 rounded-lg border border-emerald-200 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Khách đã đồng ý báo giá hỗ trợ
                  </div>
                  <div className="text-[11px] text-emerald-800 font-mono">
                    Giá chốt: <strong>{formatMoney(claim.finalSupportPrice || 0)}</strong>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openAssignTechnicianModal(claim.technicianId ? String(claim.technicianId) : "", claim.materialNote || "")}
                  className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Wrench className="w-4 h-4 shrink-0" />
                  <span>Phân Công Đội Thợ Khắc Phục</span>
                </button>
              </div>
            )}

            {/* 3c. Trạng thái TECHNICIAN_REJECTED */}
            {claim.status === "TECHNICIAN_REJECTED" && (
              <div className="space-y-3">
                <div className="p-2.5 bg-red-50 text-red-900 rounded-lg border border-red-200 text-xs">
                  <div className="font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Thợ đã từ chối việc
                  </div>
                  <p className="text-[11px] text-red-700 mt-0.5">
                    {claim.adminNote || "Thợ bận lịch đột xuất. Vui lòng phân thợ khác."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openAssignTechnicianModal("", claim.materialNote || "")}
                  className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Wrench className="w-4 h-4 shrink-0" />
                  <span>Phân Công Đội Thợ Khác</span>
                </button>
              </div>
            )}

            {/* 4. Trạng thái WORKER_ASSIGNED / IN_PROGRESS / ACCEPTED */}
            {(claim.status === "WORKER_ASSIGNED" || claim.status === "IN_PROGRESS" || claim.status === "ACCEPTED") && (
              <div className="space-y-3">
                <div className="p-2.5 bg-blue-50 text-blue-900 rounded-lg border border-blue-200 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-blue-600" />
                    <span>{claim.status === "ACCEPTED" ? "Đã giao việc cho thợ" : "Đang thi công dặm vá"}</span>
                  </div>
                  <p className="text-[11px] text-blue-800">
                    Đội thợ: <strong>{claim.technicianName}</strong>
                  </p>
                </div>
                {claim.status === "ACCEPTED" && (
                  <button
                    type="button"
                    onClick={() => openAssignTechnicianModal(claim.technicianId ? String(claim.technicianId) : "", claim.materialNote || "")}
                    className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Đổi Đội Thợ Khác</span>
                  </button>
                )}
              </div>
            )}

            {/* 5. Trạng thái WORKER_COMPLETED */}
            {claim.status === "WORKER_COMPLETED" && (
              <div className="p-3 bg-orange-50 text-orange-950 rounded-lg border border-orange-200 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1 text-orange-900">
                  <Award className="w-4 h-4 text-orange-600" />
                  <span>Thợ đã báo xong — Chờ nghiệm thu</span>
                </div>
                <p className="text-[11px] text-orange-800">
                  Giám sát {claim.surveyorName} sẽ kiểm tra hiện trường và nghiệm thu cùng khách.
                </p>
              </div>
            )}

            {/* 6. Trạng thái COMPLETED */}
            {claim.status === "COMPLETED" && (
              <div className="p-3 bg-emerald-50 text-emerald-900 rounded-lg border border-emerald-200 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Đã nghiệm thu hoàn tất đạt chuẩn</span>
              </div>
            )}

            {/* 7. Trạng thái REJECTED */}
            {claim.status === "REJECTED" && (
              <div className="p-3 bg-slate-50 text-slate-800 rounded-lg border border-slate-200 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <XCircle className="w-4 h-4 text-slate-500" /> Đã gửi báo giá hỗ trợ
                </div>
                {claim.finalSupportPrice && Number(claim.finalSupportPrice) > 0 && (
                  <p className="text-[11px] text-slate-600">
                    Mức giá: <strong>{formatMoney(claim.finalSupportPrice)}</strong> (Chờ khách phản hồi)
                  </p>
                )}
              </div>
            )}

            {/* 8. Trạng thái CANCELLED */}
            {claim.status === "CANCELLED" && (
              <div className="p-3 bg-slate-50 text-slate-600 rounded-lg border border-slate-200 text-xs font-semibold">
                Phiếu bảo hành đã hủy / đóng.
              </div>
            )}
          </div>

          {/* Card 2: HỢP NHẤT Nhân Sự & Quyết Toán Thù Lao (Không bị lặp) */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-700" />
                <span>Nhân Sự &amp; Thù Lao</span>
              </h3>
              {(claim.surveyorId || claim.technicianId) && (
                <button
                  type="button"
                  onClick={() => {
                    setEditWorkerSalary(String(worAmt));
                    setEditSurveyorSalary(String(surAmt));
                    setEditSalaryModal(true);
                  }}
                  className="px-2 py-0.5 text-[10.5px] font-bold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition cursor-pointer flex items-center gap-1 leading-none"
                  title="Chỉnh sửa số tiền công thợ / giám sát"
                >
                  <Pencil className="w-2.5 h-2.5" />
                  <span>Sửa tiền công</span>
                </button>
              )}
            </div>

            <div className="space-y-2.5 text-xs">
              {/* Giám sát */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-bold text-slate-500 uppercase">Giám Sát Khảo Sát</span>
                  {claim.surveyorId ? (
                    claim.surveyorPaid || surAmt === 0 ? (
                      <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-800 font-bold rounded text-[10px] border border-emerald-200">
                        {surAmt === 0 ? "Trách nhiệm (0đ)" : "✓ Đã chi"}
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 bg-amber-50 text-amber-800 font-bold rounded text-[10px] border border-amber-200">
                        Chờ quyết toán
                      </span>
                    )
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">Chưa phân</span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-0.5">
                  <div className="font-bold text-slate-900 text-xs">
                    {claim.surveyorName || "Chưa phân công"}
                  </div>
                  {claim.surveyorPhone && (
                    <a
                      href={`tel:${claim.surveyorPhone}`}
                      className="text-[11px] text-blue-700 hover:underline flex items-center gap-0.5"
                    >
                      <Phone className="w-2.5 h-2.5" />
                      <span>{claim.surveyorPhone}</span>
                    </a>
                  )}
                </div>

                {claim.surveyorId && (
                  <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-200/80 font-mono">
                    <span className="text-slate-500 font-sans">Thù lao:</span>
                    <span className="font-bold text-slate-900">
                      {formatMoney(surAmt)}
                      <span className="text-[10px] text-slate-500 font-sans font-normal ml-1">({surveyorDesc})</span>
                    </span>
                  </div>
                )}
              </div>

              {/* Đội thợ */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-bold text-slate-500 uppercase">Đội Thợ Thi Công</span>
                  {claim.technicianId ? (
                    claim.workerPaid || worAmt === 0 ? (
                      <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-800 font-bold rounded text-[10px] border border-emerald-200">
                        {worAmt === 0 ? "Trách nhiệm (0đ)" : "✓ Đã chi"}
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 bg-amber-50 text-amber-800 font-bold rounded text-[10px] border border-amber-200">
                        Chờ quyết toán
                      </span>
                    )
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">Chưa phân</span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-0.5">
                  <div className="font-bold text-slate-900 text-xs">
                    {claim.technicianName || "Chưa phân công"}
                  </div>
                  {claim.technicianPhone && (
                    <a
                      href={`tel:${claim.technicianPhone}`}
                      className="text-[11px] text-blue-700 hover:underline flex items-center gap-0.5"
                    >
                      <Phone className="w-2.5 h-2.5" />
                      <span>{claim.technicianPhone}</span>
                    </a>
                  )}
                </div>

                {claim.technicianId && (
                  <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-200/80 font-mono">
                    <span className="text-slate-500 font-sans">Tiền công:</span>
                    <span className="font-bold text-slate-900">
                      {formatMoney(worAmt)}
                      <span className="text-[10px] text-slate-500 font-sans font-normal ml-1">({workerDesc})</span>
                    </span>
                  </div>
                )}
              </div>

              {/* Nút VietQR Payout (chỉ khi hoàn tất và còn người chưa nhận > 0đ) */}
              {claim.status === "COMPLETED" && ((claim.surveyorId && !claim.surveyorPaid && surAmt > 0) || (claim.technicianId && !claim.workerPaid && worAmt > 0)) && (
                <button
                  type="button"
                  onClick={() => navigate(`/admin/payments?tab=WARRANTY&search=${claim.id}`, { state: { tab: "WARRANTY", search: String(claim.id) } })}
                  className="w-full mt-2 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-xs flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4 shrink-0" />
                  <span>Quyết Toán VietQR Cho Nhân Sự</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: PHÂN CÔNG GIÁM SÁT                                */}
      {/* ========================================================= */}
      <AssignWarrantySurveyorModal
        isOpen={assignSurveyorModal}
        onClose={() => setAssignSurveyorModal(false)}
        claim={claim}
        surveyors={surveyors}
        filteredSupervisors={filteredSupervisors}
        selectedSurveyorId={selectedSurveyorId}
        setSelectedSurveyorId={setSelectedSurveyorId}
        surveyorNote={surveyorNote}
        setSurveyorNote={setSurveyorNote}
        supervisorModalTab={supervisorModalTab}
        setSupervisorModalTab={setSupervisorModalTab}
        supervisorSearch={supervisorSearch}
        setSupervisorSearch={setSupervisorSearch}
        submittingSurveyor={submittingSurveyor}
        handleAssignSurveyorSubmit={handleAssignSurveyorSubmit}
      />

      {/* ========================================================= */}
      {/* MODAL 2: PHÂN CÔNG THỢ                                    */}
      {/* ========================================================= */}
      <AssignWarrantyTechnicianModal
        isOpen={assignTechnicianModal}
        onClose={() => setAssignTechnicianModal(false)}
        claim={claim}
        technicians={technicians}
        filteredTechnicians={filteredTechnicians}
        selectedTechnicianId={selectedTechnicianId}
        setSelectedTechnicianId={setSelectedTechnicianId}
        technicianNote={technicianNote}
        setTechnicianNote={setTechnicianNote}
        workerSalary={workerSalary}
        setWorkerSalary={setWorkerSalary}
        techTab={techTab}
        setTechTab={setTechTab}
        techSearch={techSearch}
        setTechSearch={setTechSearch}
        submittingTechnician={submittingTechnician}
        handleAssignTechnicianSubmit={handleAssignTechnicianSubmit}
      />

      {/* ========================================================= */}
      {/* MODAL 3: TỪ CHỐI & BÁO GIÁ HỖ TRỢ                           */}
      {/* ========================================================= */}
      <WarrantyRejectSupportModal
        isOpen={rejectModal}
        onClose={() => setRejectModal(false)}
        claim={claim}
        supportPrice={supportPrice}
        setSupportPrice={setSupportPrice}
        rejectReason={rejectReason}
        setRejectReason={setRejectReason}
        submittingReject={submittingReject}
        handleRejectSubmit={handleRejectSubmit}
      />

      {/* Modal Chỉnh Sửa Tiền Công Nhân Sự */}
      {editSalaryModal && (
        <Modal
          isOpen={editSalaryModal}
          onClose={() => setEditSalaryModal(false)}
          title={`Chỉnh Sửa Tiền Công Bảo Hành #${claim.id}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleUpdateSalariesSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900">Điều Chỉnh Mức Thù Lao Trực Tiếp</div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Số tiền bạn nhập dưới đây sẽ được lưu chính thức vào hồ sơ bảo hành và áp dụng cho việc đối soát, quét mã VietQR.
              </p>
            </div>

            {claim.technicianId && (
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-900">
                  Tiền công Đội thợ (@{claim.technicianName || "Đội thợ"}) (VNĐ):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={editWorkerSalary}
                    onChange={(e) => setEditWorkerSalary(e.target.value)}
                    className="w-full pl-3 pr-12 py-2 bg-white rounded-lg border border-slate-300 font-bold font-mono text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">
                    VNĐ
                  </span>
                </div>
                {claimSupportPrice > 0 && (
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[10.5px] text-slate-500">Gợi ý từ phí khách ({formatMoney(claimSupportPrice)}):</span>
                    <button
                      type="button"
                      onClick={() => setEditWorkerSalary(String(Math.round(claimSupportPrice * 0.6)))}
                      className="px-2 py-0.5 text-[10.5px] font-semibold bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
                    >
                      60% ({formatMoney(Math.round(claimSupportPrice * 0.6))})
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditWorkerSalary(String(Math.round(claimSupportPrice * 0.7)))}
                      className="px-2 py-0.5 text-[10.5px] font-semibold bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
                    >
                      70%
                    </button>
                  </div>
                )}
              </div>
            )}

            {claim.surveyorId && (
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-900">
                  Thù lao Giám sát (@{claim.surveyorName || "Giám sát"}) (VNĐ):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={editSurveyorSalary}
                    onChange={(e) => setEditSurveyorSalary(e.target.value)}
                    className="w-full pl-3 pr-12 py-2 bg-white rounded-lg border border-slate-300 font-bold font-mono text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">
                    VNĐ
                  </span>
                </div>
                {claimSupportPrice > 0 && (
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[10.5px] text-slate-500">Gợi ý từ phí khách ({formatMoney(claimSupportPrice)}):</span>
                    <button
                      type="button"
                      onClick={() => setEditSurveyorSalary(String(Math.round(claimSupportPrice * 0.1)))}
                      className="px-2 py-0.5 text-[10.5px] font-semibold bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
                    >
                      10% ({formatMoney(Math.round(claimSupportPrice * 0.1))})
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setEditSalaryModal(false)}
                className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submittingEditSalary}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition cursor-pointer shadow-xs disabled:opacity-50"
              >
                {submittingEditSalary ? "Đang lưu..." : "Lưu Tiền Công"}
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


