import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link, useOutletContext } from "react-router-dom";

import AxiosConfig from "../../../util/AxiosConfig";
import DashboardHeader from "../../../components/layout/DashboardHeader";
import LoadingSpinner from "../../../components/common/LoadingSpinner";
import ImageLightboxModal from "../../../components/common/ImageLightboxModal";
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
  const [techTab, setTechTab] = useState("all");
  const [techSearch, setTechSearch] = useState("");
  const [submittingTechnician, setSubmittingTechnician] = useState(false);

  // Modal 3: Từ chối & Báo giá hỗ trợ
  const [rejectModal, setRejectModal] = useState(false);
  const [supportPrice, setSupportPrice] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [submittingReject, setSubmittingReject] = useState(false);

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
      });
      showToast?.("Đã duyệt phân Đội Thợ khắc phục thành công!", "success");
      setAssignTechnicianModal(false);
      fetchClaimDetail();
    } catch (err) {
      showToast?.(err.response?.data?.message || "Phân thợ thất bại!", "error");
    } finally {
      setSubmittingTechnician(false);
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

  return (
    <div className="space-y-4 sm:space-y-6 pb-16">
      {/* Top Breadcrumbs & Back */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3 sm:pb-4">
        <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
          <button
            onClick={() => navigate("/admin/warranties")}
            className="flex items-center gap-1 hover:text-slate-900 font-semibold transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-900" />
            <span>Quản Lý Bảo Hành</span>
          </button>
          <span>/</span>
          <span className="text-slate-900 font-bold font-mono">Phiếu #{claim.id}</span>
          <span>/</span>
          <Link
            to={`/admin/bookings/${claim.bookingId}`}
            className="text-slate-900 font-semibold hover:underline flex items-center gap-0.5"
          >
            <span>Đơn hàng #{claim.bookingId}</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </Link>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {getStatusBadge(claim.status)}
        </div>
      </div>

      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 bg-slate-50 text-slate-900 rounded-xl border border-slate-200 shrink-0 mt-0.5 sm:mt-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
              Phiếu Bảo Hành #{claim.id} &bull; Đơn #{claim.bookingId}
            </h1>
            <p className="text-xs text-slate-500">
              Gửi yêu cầu lúc: {new Date(claim.createdAt).toLocaleString("vi-VN")}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <span className="text-slate-500 block text-[10px] font-semibold uppercase">Thời hạn:</span>
            <strong className="text-slate-900 font-bold text-xs">
              {claim.warrantyYears ? `${claim.warrantyYears} Năm Chính Hãng` : "2 Năm Chính Hãng"}
            </strong>
          </div>
          <Link
            to={`/admin/bookings/${claim.bookingId}`}
            className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-50 text-slate-900 font-semibold rounded-lg text-xs transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <span>Xem Đơn Hàng Gốc</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Stepper Timeline */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs">
        <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-3">
          Tiến Trình Xử Lý Sự Cố Bảo Hành
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-2.5">
          {[
            { step: 1, title: "1. Tiếp Nhận", desc: "Phân Giám sát", active: stepCurrent >= 1 },
            { step: 2, title: "2. Khảo Sát", desc: "Thẩm định nguyên nhân", active: stepCurrent >= 2 },
            { step: 3, title: "3. Duyệt & Phân Thợ", desc: "Giao việc thợ dặm vá", active: stepCurrent >= 3 },
            { step: 4, title: "4. Thi Công", desc: "Thợ dặm vá bột & sơn", active: stepCurrent >= 4 },
            { step: 5, title: "5. Nghiệm Thu", desc: "Khách duyệt & Quét VietQR", active: stepCurrent >= 6 },
          ].map((item) => (
            <div
              key={item.step}
              className={`p-2.5 sm:p-3 rounded-lg border transition ${item.active
                  ? "bg-slate-50 border-slate-200 text-slate-900"
                  : "bg-slate-50 border-slate-200 text-slate-500 opacity-60"
                }`}
            >
              <div className="flex items-center gap-1.5 font-semibold text-xs">
                {item.active ? (
                  <CheckCircle2 className="w-4 h-4 text-slate-900 shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-200 text-center text-[10px] leading-3.5 text-slate-500 font-bold shrink-0">
                    {item.step}
                  </div>
                )}
                <span className="truncate">{item.title}</span>
              </div>
              <div className="text-[10.5px] text-slate-500 mt-1 line-clamp-1">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid: 2 Cột */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 items-start">
        {/* CỘT TRÁI (2/3): THÔNG TIN KHÁCH HÀNG & BÁO CÁO HIỆN TRƯỜNG */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Card 1: Khách hàng & Công trình */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-3">
              <User className="w-4 h-4 text-slate-900" />
              <span>Thông Tin Khách Hàng &amp; Địa Chỉ Công Trình</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-500 block text-[11px]">Họ tên khách hàng:</span>
                <strong className="text-slate-900 text-sm font-bold block">{claim.customerName || "Khách hàng"}</strong>
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 block text-[11px]">Số điện thoại liên hệ:</span>
                <a
                  href={`tel:${claim.customerPhone}`}
                  className="text-slate-900 font-semibold text-sm hover:underline flex items-center gap-1"
                >
                  <Phone className="w-3.5 h-3.5 text-slate-900" />
                  <span>{claim.customerPhone || "Chưa có SĐT"}</span>
                </a>
              </div>

              <div className="sm:col-span-2 space-y-1">
                <span className="text-slate-500 block text-[11px]">Địa chỉ công trình:</span>
                <div className="flex items-start gap-1.5 text-slate-900 font-medium">
                  <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <span>{claim.address || "Chưa cập nhật địa chỉ"}</span>
                </div>
              </div>

              {claim.preferredDate && (
                <div className="sm:col-span-2 p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-900 text-xs flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-900 shrink-0" />
                  <span>
                    Thời gian khách hẹn thuận tiện:{" "}
                    <strong>{new Date(claim.preferredDate).toLocaleDateString("vi-VN")}</strong>{" "}
                    {claim.preferredTime ? `(Khung giờ: ${claim.preferredTime})` : ""}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Sự cố khách báo & Album ảnh khách gửi */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-3">
              <ShieldAlert className="w-4 h-4 text-slate-900" />
              <span>Hiện Trạng Sự Cố Khách Hàng Yêu Cầu Bảo Hành</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Tiêu đề sự cố:</span>
                <div className="text-slate-900 font-bold text-sm mt-0.5">
                  {claim.issueTitle || "Yêu cầu kiểm tra & dặm vá sơn"}
                </div>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px]">Mô tả chi tiết từ khách hàng:</span>
                <p className="text-slate-900 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs mt-1">
                  {claim.description}
                </p>
              </div>

              {customerImages.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <span className="text-slate-500 font-semibold block text-xs">
                    Ảnh chụp sự cố khách gửi ({customerImages.length} ảnh):
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                    {customerImages.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt={`Khách gửi ${i + 1}`}
                        onClick={() => setPreviewImage(img)}
                        className="w-full h-24 sm:h-28 rounded-lg object-cover border border-slate-200 cursor-pointer hover:opacity-90 transition shadow-2xs"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Báo cáo khảo sát thẩm định của Giám Sát */}
          {claim.surveyNote ? (
            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-slate-900" />
                  <span>Báo Cáo Thẩm Định Của Giám Sát Hiện Trường</span>
                </h3>
                {claim.faultType === "COMPANY_FAULT" ? (
                  <span className="px-2.5 py-0.5 rounded bg-slate-50 text-slate-900 font-semibold text-xs border border-slate-200">
                    ✓ Lỗi Kỹ Thuật (Bảo Hành 0đ)
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded bg-slate-50 text-slate-900 font-semibold text-xs border border-slate-200">
                    ⚠ Lỗi Khách Quan Ngoại Lực
                  </span>
                )}
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-2 text-slate-900">
                  <UserCheck className="w-4 h-4 text-slate-900" />
                  <span>
                    Giám sát thẩm định: <strong>{claim.surveyorName}</strong> ({claim.surveyorPhone || "Chưa có SĐT"})
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px]">Nội dung khảo sát &amp; đánh giá kỹ thuật:</span>
                  <p className="text-slate-900 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs mt-1">
                    {claim.surveyNote}
                  </p>
                </div>

                {claim.materialNote && (
                  <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-900 space-y-1">
                    <strong className="flex items-center gap-1.5 text-slate-900 text-xs">
                      <Package className="w-4 h-4 text-slate-900" />
                      <span>Vật tư &amp; Sơn dặm vá Giám sát trực tiếp chuẩn bị cho Thợ:</span>
                    </strong>
                    <p className="text-slate-900 text-xs pl-5 leading-relaxed font-medium">
                      {claim.materialNote}
                    </p>
                  </div>
                )}

                {surveyImages.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <span className="text-slate-500 font-semibold block text-xs">
                      Ảnh hiện trường Giám sát đo đạc &amp; chụp ({surveyImages.length} ảnh):
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                      {surveyImages.map((img, i) => (
                        <img
                          key={i}
                          src={img}
                          alt={`Khảo sát ${i + 1}`}
                          onClick={() => setPreviewImage(img)}
                          className="w-full h-24 sm:h-28 rounded-lg object-cover border border-slate-200 cursor-pointer hover:opacity-90 transition shadow-2xs"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-xl border border-dashed border-slate-200 p-6 text-center space-y-2 text-slate-500">
              <ClipboardCheck className="w-8 h-8 mx-auto text-slate-500 stroke-1" />
              <p className="text-xs font-bold">Chưa có báo cáo khảo sát hiện trường từ Giám Sát</p>
              <p className="text-[11px] text-slate-500">
                Sau khi Admin phân Giám Sát, Giám sát sẽ đến hiện trường thẩm định nguyên nhân và gửi báo cáo về hệ thống.
              </p>
            </div>
          )}

          {/* Card 4: Kết quả nghiệm thu hoàn thành của Giám Sát */}
          {resolvedImages.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-slate-500" />
                  <span>Bộ Ảnh Nghiệm Thu Hoàn Tất Sau Sửa Chữa (Giám Sát Chụp)</span>
                </h3>
                <span className="px-2.5 py-0.5 rounded bg-slate-50 text-slate-900 font-semibold text-xs border border-slate-200">
                  ✓ Đạt Chuẩn Kỹ Thuật
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {resolvedImages.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt={`Nghiệm thu ${i + 1}`}
                    onClick={() => setPreviewImage(img)}
                    className="w-full h-24 sm:h-28 rounded-lg object-cover border border-slate-200 cursor-pointer hover:opacity-90 transition shadow-2xs"
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CỘT PHẢI (1/3): BẢNG ĐIỀU KHIỂN THAO TÁC & QUYẾT TOÁN VIETQR */}
        <div className="space-y-4 sm:space-y-6 lg:sticky lg:top-4">
          {/* Card Nhân sự phụ trách */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-3">
              <Layers className="w-4 h-4 text-slate-900" />
              <span>Nhân Sự Phụ Trách Phiếu</span>
            </h3>

            {/* Giám sát */}
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-semibold text-slate-900 uppercase">Giám sát khảo sát</span>
                {claim.surveyorId ? (
                  <span className="text-[10px] font-semibold bg-slate-50 text-slate-900 px-2 py-0.5 rounded">
                    Đã phân công
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold bg-slate-50 text-slate-900 px-2 py-0.5 rounded">
                    Chưa phân
                  </span>
                )}
              </div>
              <div className="font-bold text-slate-900 text-xs">
                {claim.surveyorName || "Chưa gán Giám Sát"}
              </div>
              {claim.surveyorPhone && (
                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-500" />
                  <span>{claim.surveyorPhone}</span>
                </div>
              )}
            </div>

            {/* Đội thợ */}
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-semibold text-slate-900 uppercase">Đội thợ thi công</span>
                {claim.technicianId ? (
                  <span className="text-[10px] font-semibold bg-slate-50 text-slate-900 px-2 py-0.5 rounded">
                    Đã phân công
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold bg-slate-50 text-slate-900 px-2 py-0.5 rounded">
                    Chưa gán
                  </span>
                )}
              </div>
              <div className="font-bold text-slate-900 text-xs">
                {claim.technicianName || "Chưa gán Đội Thợ"}
              </div>
              {claim.technicianPhone && (
                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-500" />
                  <span>{claim.technicianPhone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Card Quyết toán Thù Lao Nhân Sự (Thiết kế đồng bộ với Chi tiết yêu cầu) */}
          {claim.status === "COMPLETED" && (claim.surveyorId || claim.technicianId) && (
            <div id="staff-payout-section" className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>Quyết Toán Thù Lao Nhân Sự</span>
                </h4>
                {((!claim.surveyorId || claim.surveyorPaid) && (!claim.technicianId || claim.workerPaid)) ? (
                  <span className="text-[10px] font-semibold text-slate-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 leading-none">
                    ✓ Đã quyết toán 100%
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-slate-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 leading-none">
                    Chờ quyết toán
                  </span>
                )}
              </div>

              <div className="space-y-2.5 text-xs">
                {/* Giám sát viên */}
                {claim.surveyorId && (
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {claim.surveyorAvatar ? (
                        <img
                          src={claim.surveyorAvatar}
                          alt="Supervisor"
                          className="w-7 h-7 rounded-md object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-md bg-slate-50 text-slate-900 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200">
                          {(claim.surveyorName || "S").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold text-slate-900 truncate">
                          Giám sát: @{claim.surveyorName || "Giám sát"}
                        </div>
                        <div className="text-[10.5px] text-slate-500 font-mono">
                          Thù lao: <strong className="text-slate-900">{formatMoney(claim.surveyorSalary || 100000)}</strong>
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {claim.surveyorPaid ? (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 font-semibold rounded text-[11px] flex items-center gap-1 border border-emerald-200 leading-none">
                          <Check className="w-3 h-3 shrink-0" />
                          <span>Đã quyết toán</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-800 font-semibold rounded text-[11px] flex items-center gap-1 border border-amber-200 leading-none">
                          <Clock className="w-3 h-3 shrink-0" />
                          <span>Chưa quyết toán</span>
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Đội thợ thi công */}
                {claim.technicianId && (
                  <div className="p-2.5 bg-emerald-50/40 rounded-lg border border-emerald-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {claim.technicianAvatar ? (
                        <img
                          src={claim.technicianAvatar}
                          alt="Technician"
                          className="w-7 h-7 rounded-md object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-md bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-200">
                          {(claim.technicianName || "T").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold text-emerald-900 truncate">
                          Đội thợ: @{claim.technicianName || "Đội thợ"}
                        </div>
                        <div className="text-[10.5px] text-slate-500 font-mono">
                          Thù lao: <strong className="text-slate-900">{formatMoney(claim.workerSalary || 200000)}</strong>
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {claim.workerPaid ? (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 font-semibold rounded text-[11px] flex items-center gap-1 border border-emerald-200 leading-none">
                          <Check className="w-3 h-3 shrink-0" />
                          <span>Đã quyết toán</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-800 font-semibold rounded text-[11px] flex items-center gap-1 border border-amber-200 leading-none">
                          <Clock className="w-3 h-3 shrink-0" />
                          <span>Chưa quyết toán</span>
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Nút điều hướng sang Quản lý thanh toán */}
                {(!claim.surveyorPaid || !claim.workerPaid) && (
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/payments?tab=WARRANTY&search=${claim.id}`, { state: { tab: "WARRANTY", search: String(claim.id) } })}
                    className="w-full mt-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-xs flex items-center justify-center gap-2 text-center leading-normal"
                  >
                    <CreditCard className="w-4 h-4 shrink-0" />
                    <span>Đi Đến Quản Lý Thanh Toán Để Quyết Toán VietQR</span>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Card Bảng Thao Tác Bước Tiếp Theo */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-3">
              <Sparkles className="w-4 h-4 text-slate-900" />
              <span>Thao Tác Xử Lý Bước Tiếp Theo</span>
            </h3>

            {/* 1. Trạng thái PENDING: Phân Giám sát */}
            {claim.status === "PENDING" && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Khách hàng vừa gửi yêu cầu bảo hành. Admin vui lòng phân công 1 Giám Sát đến tận nơi kiểm tra hiện trường.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSurveyorId("");
                    setSurveyorNote("");
                    setAssignSurveyorModal(true);
                  }}
                  className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-600 text-white font-semibold rounded-lg text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs text-center leading-normal"
                >
                  <UserCheck className="w-4 h-4 shrink-0" />
                  <span>Phân Công Giám Sát Khảo Sát</span>
                </button>
              </div>
            )}

            {/* 2. Trạng thái SURVEY_ASSIGNED: Đang chờ khảo sát */}
            {claim.status === "SURVEY_ASSIGNED" && (
              <div className="space-y-3">
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-900 text-xs space-y-1.5">
                  <div className="font-bold flex items-center gap-1 text-slate-900">
                    <Clock className="w-4 h-4 text-slate-900 shrink-0" />
                    <span>Giám Sát đang đi khảo sát</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-900">
                    Giám sát <strong>{claim.surveyorName}</strong> đang đến công trình đo đạc và lập biên bản thẩm định.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSurveyorId(claim.surveyorId ? String(claim.surveyorId) : "");
                    setSurveyorNote(claim.adminNote || "");
                    setAssignSurveyorModal(true);
                  }}
                  className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-50 text-slate-900 font-semibold rounded-lg text-xs transition cursor-pointer text-center leading-normal"
                >
                  <span>Đổi Giám Sát Khác</span>
                </button>
              </div>
            )}

            {/* 3. Trạng thái SURVEYED: Đã có báo cáo, Admin duyệt */}
            {claim.status === "SURVEYED" && (
              <div className="space-y-3">
                {claim.faultType === "COMPANY_FAULT" ? (
                  <div className="space-y-3">
                    <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-900 text-xs space-y-1">
                      <div className="font-bold text-slate-900">✓ Giám sát xác nhận Lỗi Kỹ Thuật (0đ)</div>
                      <p className="text-[11px] text-slate-900">
                        Vật tư dặm vá đã được Giám sát chuẩn bị. Admin duyệt và phân Đội Thợ đến khắc phục.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTechnicianId("");
                        setTechnicianNote("");
                        setAssignTechnicianModal(true);
                      }}
                      className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-600 text-white font-semibold rounded-lg text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs text-center leading-normal"
                    >
                      <Wrench className="w-4 h-4 shrink-0" />
                      <span>Duyệt &amp; Phân Đội Thợ Khắc Phục</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-900 text-xs space-y-1">
                      <div className="font-bold text-slate-900">⚠ Giám sát thẩm định Lỗi Khách Quan</div>
                      <p className="text-[11px] text-slate-900">
                        Sự cố do ngoại lực / thấm tường ngoài phạm vi bảo hành. Giá đề xuất hỗ trợ:{" "}
                        <strong>{formatMoney(claim.suggestedPrice || 0)}</strong>.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSupportPrice(claim.suggestedPrice ? String(claim.suggestedPrice) : "");
                        setRejectReason(claim.surveyNote || "");
                        setRejectModal(true);
                      }}
                      className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-600 text-white font-semibold rounded-lg text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs text-center leading-normal"
                    >
                      <Send className="w-4 h-4 shrink-0" />
                      <span>Gửi Báo Giá Hỗ Trợ &amp; Từ Chối Bảo Hành</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 3b. Trạng thái CUSTOMER_ACCEPTED_SUPPORT */}
            {claim.status === "CUSTOMER_ACCEPTED_SUPPORT" && (
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-slate-900 text-xs space-y-3 shadow-xs">
                <div className="font-bold flex items-center gap-1.5 text-slate-900 text-xs uppercase">
                  <Sparkles className="w-4 h-4 text-slate-900 shrink-0" />
                  <span>Khách Hàng Đã Đồng Ý Giá Sửa Chữa Hỗ Trợ</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mức giá hỗ trợ đã chốt:</span>
                    <strong className="text-slate-900 font-bold text-xs font-mono">{formatMoney(claim.finalSupportPrice || 0)}</strong>
                  </div>
                  {claim.preferredDate && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Lịch khách chọn thi công:</span>
                      <strong className="text-slate-900 font-bold">{claim.preferredDate} {claim.preferredTime ? `(${claim.preferredTime})` : ""}</strong>
                    </div>
                  )}
                  <p className="text-slate-500 italic pt-1 border-t border-slate-200">
                    Vui lòng phân công Đội thợ (ưu tiên thợ cũ) đến khắc phục theo lịch hẹn của khách.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTechnicianId(claim.technicianId ? String(claim.technicianId) : "");
                    setTechnicianNote(claim.materialNote || "");
                    setAssignTechnicianModal(true);
                  }}
                  className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-600 text-white font-semibold rounded-lg text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs text-center leading-normal"
                >
                  <Wrench className="w-4 h-4 shrink-0" />
                  <span>Phân Công Đội Thợ Khắc Phục Ngay</span>
                </button>
              </div>
            )}

            {/* 3c. Trạng thái TECHNICIAN_REJECTED */}
            {claim.status === "TECHNICIAN_REJECTED" && (
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-slate-900 text-xs space-y-3 shadow-xs">
                <div className="font-bold flex items-center gap-1.5 text-slate-900 text-xs uppercase">
                  <AlertTriangle className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>Thợ Thi Công Đã Từ Chối Nhận Việc</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5 text-[11px]">
                  <p className="text-slate-900 leading-relaxed font-medium">
                    {claim.adminNote || "Thợ được phân công trước đó đã từ chối nhận việc do bận lịch hoặc lý do đột xuất."}
                  </p>
                  <p className="text-slate-500 italic pt-1 border-t border-slate-200">
                    Vui lòng chọn Đội thợ khác để tiếp tục tiến trình xử lý cho khách.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTechnicianId("");
                    setTechnicianNote(claim.materialNote || "");
                    setAssignTechnicianModal(true);
                  }}
                  className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-600 text-white font-semibold rounded-lg text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs text-center leading-normal"
                >
                  <Wrench className="w-4 h-4 shrink-0" />
                  <span>Phân Công Đội Thợ Khác Ngay</span>
                </button>
              </div>
            )}

            {/* 4. Trạng thái WORKER_ASSIGNED / IN_PROGRESS / ACCEPTED */}
            {(claim.status === "WORKER_ASSIGNED" || claim.status === "IN_PROGRESS" || claim.status === "ACCEPTED") && (
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-900 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold flex items-center gap-1.5 text-slate-900">
                    <Wrench className="w-4 h-4 text-slate-900 animate-spin shrink-0" />
                    <span>{claim.status === "ACCEPTED" ? "Đã Giao Việc Cho Thợ" : "Đội Thợ Đang Thi Công"}</span>
                  </div>
                  {claim.status === "ACCEPTED" && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTechnicianId(claim.technicianId ? String(claim.technicianId) : "");
                        setTechnicianNote(claim.materialNote || "");
                        setAssignTechnicianModal(true);
                      }}
                      className="text-[11px] text-slate-900 font-semibold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3 shrink-0" />
                      <span>Đổi thợ khác</span>
                    </button>
                  )}
                </div>
                <p className="text-[11px] leading-relaxed text-slate-900">
                  Thợ (<strong>{claim.technicianName}</strong>) đang chuẩn bị / thi công dặm vá hoàn thiện. Thợ xong sẽ bấm 1-click báo hoàn thành.
                </p>
              </div>
            )}

            {/* 5. Trạng thái WORKER_COMPLETED */}
            {claim.status === "WORKER_COMPLETED" && (
              <div className="p-3.5 bg-orange-50 rounded-lg border border-orange-200 text-orange-950 text-xs space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-orange-900">
                  <Award className="w-4 h-4 text-orange-600 shrink-0" />
                  <span>Thợ Đã Làm Xong - Chờ Giám Sát Nghiệm Thu</span>
                </div>
                <p className="text-[11px] leading-relaxed text-orange-800">
                  Giám sát (<strong>{claim.surveyorName}</strong>) đang đến hiện trường kiểm tra chất lượng màng sơn cùng khách hàng và chụp ảnh nghiệm thu.
                </p>
              </div>
            )}

            {/* 6. Trạng thái COMPLETED */}
            {claim.status === "COMPLETED" && (
              <div className="p-3.5 bg-slate-50 text-slate-900 rounded-lg border border-slate-200 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-slate-500 shrink-0" />
                <span>Công trình bảo hành đã nghiệm thu hoàn tất đạt chuẩn chất lượng</span>
              </div>
            )}

            {/* 7. Trạng thái REJECTED */}
            {claim.status === "REJECTED" && (
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-900 text-xs space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-slate-900">
                  <XCircle className="w-4 h-4 text-slate-500" />
                  <span>Đã Gửi Báo Giá Hỗ Trợ (Chờ Khách Phản Hồi)</span>
                </div>
                {claim.finalSupportPrice && Number(claim.finalSupportPrice) > 0 && (
                  <p className="text-[11px] text-slate-900 leading-relaxed">
                    Mức giá hỗ trợ đã báo khách: <strong>{formatMoney(claim.finalSupportPrice)}</strong>. Đang chờ khách hàng bấm Đồng ý hoặc Từ chối trên ứng dụng.
                  </p>
                )}
              </div>
            )}

            {/* 8. Trạng thái CANCELLED */}
            {claim.status === "CANCELLED" && (
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-900 text-xs space-y-1">
                <div className="font-bold text-slate-900">Đã Hủy / Đóng Phiếu Bảo Hành</div>
                <p className="text-[11px] text-slate-500">
                  Khách hàng đã từ chối báo giá sửa chữa hỗ trợ hoặc đơn bị hủy bởi ban quản trị.
                </p>
              </div>
            )}
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


