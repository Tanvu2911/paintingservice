import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import AxiosConfig from "../../../util/AxiosConfig";
import StatusBadge from "../../../components/common/StatusBadge";
import LoadingSpinner from "../../../components/common/LoadingSpinner";
import OrderTimeline from "./OrderTimeline";
import ContractModal from "../../../components/common/ContractModal";
import ImageLightboxModal from "../../../components/common/ImageLightboxModal";
import AssignStaffModal from "./components/AssignStaffModal";
import SendQuoteModal from "./components/SendQuoteModal";
import AdminSignConfirmModal from "./components/AdminSignConfirmModal";
import OrderDailyReportsModal from "./components/OrderDailyReportsModal";
import OrderPayoutModal from "./components/OrderPayoutModal";
import { parseHanoiAddress } from "../../../data/hanoiLocations";
import {
  UserCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Calendar,
  MapPin,
  Clock,
  Send,
  PenTool,
  ShieldCheck,
  User,
  Check,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Download,
  DollarSign,
  CreditCard,
  Phone,
  Copy,
  CheckCheck,
  ExternalLink,
  Wrench,
  Camera,
  Maximize2,
  FileSignature,
} from "lucide-react";
import { exportContractPDF } from "../../../util/contractPdfExport";
import { formatMoney } from "../../../util/formatters";
import {
  getVietQRBankCode,
  parseNegotiationInfo,
  formatDate,
  parseImageUrls,
} from "../../../util/orderFlowUtils";

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, showToast } = useOutletContext();

  const [order, setOrder] = useState(null);
  const [bookingDetails, setBookingDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [supervisors, setSupervisors] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [assignModal, setAssignModal] = useState(null); // 'supervisor' | 'worker'
  const [selectedId, setSelectedId] = useState("");

  // Tab điều hướng chính
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'staff' | 'reports' | 'contract'
  const [copied, setCopied] = useState("");

  const handleCopy = (text, type) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(""), 2000);
  };

  // Hợp đồng
  const [contract, setContract] = useState(null);
  const [contractModalOpen, setContractModalOpen] = useState(false);

  // Báo cáo ngày
  const [dailyReports, setDailyReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportsModalOpen, setReportsModalOpen] = useState(false);

  // Quote
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [quoteTotal, setQuoteTotal] = useState("");
  const [quoteDeposit, setQuoteDeposit] = useState("");
  const [quoteEstimatedDays, setQuoteEstimatedDays] = useState("3");
  const [quoteWarrantyYears, setQuoteWarrantyYears] = useState("2");

  // Modal Filter Tabs
  const [workerModalTab, setWorkerModalTab] = useState("all");
  const [supervisorModalTab, setSupervisorModalTab] = useState("all");

  // Deposit Confirm & Admin Sign
  const [confirmDepositModal, setConfirmDepositModal] = useState(false);
  const adminSigCanvasRef = useRef(null);
  const [hasAdminSignature, setHasAdminSignature] = useState(false);

  // Payments & Lightbox
  const [payments, setPayments] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);

  // Quyết toán thù lao nhân sự
  const [salaryHistories, setSalaryHistories] = useState([]);
  const [payoutModalData, setPayoutModalData] = useState(null);
  const [submittingPayout, setSubmittingPayout] = useState(false);

  // Init canvas drawing
  useEffect(() => {
    if (confirmDepositModal && adminSigCanvasRef.current) {
      const canvas = adminSigCanvasRef.current;
      const ctx = canvas.getContext("2d");
      let drawing = false;

      const getPos = (evt) => {
        const rect = canvas.getBoundingClientRect();
        if (evt.touches) {
          return {
            x: evt.touches[0].clientX - rect.left,
            y: evt.touches[0].clientY - rect.top,
          };
        }
        return {
          x: evt.clientX - rect.left,
          y: evt.clientY - rect.top,
        };
      };

      const startPos = (e) => {
        e.preventDefault();
        drawing = true;
        setHasAdminSignature(true);
        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
      };

      const draw = (e) => {
        if (!drawing) return;
        e.preventDefault();
        const pos = getPos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      };

      const stopPos = () => {
        drawing = false;
        ctx.closePath();
      };

      canvas.addEventListener("mousedown", startPos);
      canvas.addEventListener("mousemove", draw);
      canvas.addEventListener("mouseup", stopPos);
      canvas.addEventListener("mouseleave", stopPos);

      canvas.addEventListener("touchstart", startPos, { passive: false });
      canvas.addEventListener("touchmove", draw, { passive: false });
      canvas.addEventListener("touchend", stopPos);

      return () => {
        canvas.removeEventListener("mousedown", startPos);
        canvas.removeEventListener("mousemove", draw);
        canvas.removeEventListener("mouseup", stopPos);
        canvas.removeEventListener("mouseleave", stopPos);
        canvas.removeEventListener("touchstart", startPos);
        canvas.removeEventListener("touchmove", draw);
        canvas.removeEventListener("touchend", stopPos);
      };
    }
  }, [confirmDepositModal]);

  const clearAdminSignature = () => {
    if (adminSigCanvasRef.current) {
      const canvas = adminSigCanvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasAdminSignature(false);
    }
  };

  const parseImageUrls = (str) => {
    if (!str) return [];
    if (Array.isArray(str)) return str;
    if (typeof str !== "string") return [];
    return str
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const fetchOrder = useCallback(async () => {
    try {
      const res = await AxiosConfig.get(`/bookings/${id}`);
      setOrder(res.data);
    } catch {
      showToast?.("Không tải được chi tiết đơn", "error");
    }
  }, [id, showToast]);

  const fetchBookingDetail = useCallback(async (bookingId) => {
    try {
      const res = await AxiosConfig.get(`/booking-details/booking/${bookingId}`);
      setBookingDetails(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Lỗi tải chi tiết booking-details:", err);
      setBookingDetails([]);
    }
  }, []);

  const fetchContract = useCallback(async (bookingId) => {
    try {
      const res = await AxiosConfig.get("/contracts");
      const list = Array.isArray(res.data) ? res.data : [];
      const found = list.find(
        (c) => c.bookingId === Number(bookingId) || c.bookingId === bookingId
      );
      setContract(found || null);
    } catch (err) {
      console.error("Lỗi tải hợp đồng:", err);
      setContract(null);
    }
  }, []);

  const fetchPayments = useCallback(async (bookingId) => {
    if (!bookingId) return;
    try {
      const res = await AxiosConfig.get(`/payments/booking/${bookingId}`);
      setPayments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Lỗi tải thanh toán:", err);
      setPayments([]);
    }
  }, []);

  const fetchDailyReports = useCallback(async (bookingId) => {
    if (!bookingId) {
      setDailyReports([]);
      return;
    }
    try {
      setLoadingReports(true);
      const res = await AxiosConfig.get(`/daily-reports/booking/${bookingId}`);
      setDailyReports(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Lỗi tải báo cáo ngày:", err);
      setDailyReports([]);
    } finally {
      setLoadingReports(false);
    }
  }, []);

  const fetchSalaryHistories = useCallback(async (bookingId) => {
    if (!bookingId) return;
    try {
      const res = await AxiosConfig.get("/salary-histories");
      const list = Array.isArray(res.data) ? res.data : res.data?.content || [];
      const filtered = list.filter(
        (s) => Number(s.bookingId || s.booking?.id) === Number(bookingId)
      );
      setSalaryHistories(filtered);
    } catch {
      setSalaryHistories([]);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      setLoading(true);
      try {
        const [orderRes, supRes, workerRes, allBRes] = await Promise.all([
          AxiosConfig.get(`/bookings/${id}`),
          AxiosConfig.get("/staff?staffType=SUPERVISOR").catch(() => ({ data: [] })),
          AxiosConfig.get("/staff?staffType=WORKER").catch(() => ({ data: [] })),
          AxiosConfig.get("/bookings").catch(() => ({ data: [] })),
        ]);

        if (!isMounted) return;

        setOrder(orderRes.data);

        const rawSupList = supRes.data?.content || supRes.data?.data || supRes.data || [];
        const rawWorkerList = workerRes.data?.content || workerRes.data?.data || workerRes.data || [];
        const rawAllB = allBRes.data?.content || allBRes.data?.data || allBRes.data || [];

        const availableWorkers = (Array.isArray(rawWorkerList) ? rawWorkerList : []).filter(
          (s) => s.available !== false && s.staffType !== "SUPERVISOR"
        );

        setSupervisors(Array.isArray(rawSupList) ? rawSupList : []);
        setWorkers(availableWorkers);
        setAllBookings(Array.isArray(rawAllB) ? rawAllB : []);

        await Promise.all([
          fetchBookingDetail(id),
          fetchContract(id),
          fetchDailyReports(id),
          fetchPayments(id),
          fetchSalaryHistories(id),
        ]);
      } catch {
        if (isMounted) showToast?.("Không tải được chi tiết đơn", "error");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadInitialData();
    return () => {
      isMounted = false;
    };
  }, [
    id,
    fetchBookingDetail,
    fetchContract,
    fetchDailyReports,
    fetchPayments,
    fetchSalaryHistories,
    showToast,
  ]);

  // Compute Active Workloads per Staff
  const activeSupervisorJobs = useMemo(() => {
    const map = {};
    allBookings.forEach((b) => {
      if (
        b.supervisorId &&
        !["COMPLETED", "CANCELLED", "FULLY_PAID", "PAID_TO_STAFF"].includes(b.status)
      ) {
        const sId = String(b.supervisorId);
        map[sId] = (map[sId] || 0) + 1;
      }
    });
    return map;
  }, [allBookings]);

  const activeWorkerJobs = useMemo(() => {
    const map = {};
    allBookings.forEach((b) => {
      const wId = b.technicianId || b.preferredTechnicianId;
      if (
        wId &&
        !["COMPLETED", "CANCELLED", "FULLY_PAID", "PAID_TO_STAFF"].includes(b.status)
      ) {
        const key = String(wId);
        map[key] = (map[key] || 0) + 1;
      }
    });
    return map;
  }, [allBookings]);

  // Extract District
  const projectDistrict = useMemo(() => {
    if (!order?.address) return "";
    const parsed = parseHanoiAddress(order.address);
    return parsed.district || "";
  }, [order?.address]);

  // Phân công Giám sát
  const handleAssignSupervisor = async () => {
    if (!selectedId) {
      showToast?.("Vui lòng chọn giám sát viên", "error");
      return;
    }
    try {
      await AxiosConfig.post(`/bookings/${id}/assign-supervisor`, {
        supervisorId: Number(selectedId),
      });
      showToast?.("Đã phân công Giám sát đi khảo sát!", "success");
      setAssignModal(null);
      fetchOrder();
    } catch (err) {
      showToast?.(err.response?.data?.message || "Lỗi phân công giám sát", "error");
    }
  };

  // Phân công Đội thợ
  const handleAssignWorker = async () => {
    const targetWorkerId =
      selectedId || order?.preferredTechnicianId || order?.preferredTechnician?.id;

    if (!targetWorkerId) {
      showToast?.("Vui lòng chọn đội thợ thi công", "error");
      return;
    }
    try {
      await AxiosConfig.post(`/bookings/${id}/assign-team`, {
        technicianId: Number(targetWorkerId),
      });
      showToast?.(
        contract?.customerSigned
          ? "Đã bàn giao đơn cho Đội thợ!"
          : "Đã gán đội thợ thành công!",
        "success"
      );
      setAssignModal(null);
      fetchOrder();
    } catch (err) {
      showToast?.(err.response?.data?.message || "Lỗi giao đơn cho đội thợ", "error");
    }
  };

  const handleAssign = async () => {
    if (assignModal === "supervisor") {
      await handleAssignSupervisor();
    } else {
      await handleAssignWorker();
    }
  };

  // Báo giá & Ký hợp đồng Bên B (Pre-sign)
  const handleSendQuote = async (adminSignature) => {
    if (!quoteTotal || Number(quoteTotal) <= 0) {
      showToast?.("Vui lòng nhập tổng báo giá hợp lệ", "error");
      return;
    }
    try {
      const payload = {
        totalAmount: Number(quoteTotal),
        estimatedDays: Number(quoteEstimatedDays) || 3,
        warrantyYears: Number(quoteWarrantyYears) || 2,
      };
      if (quoteDeposit) payload.depositAmount = Number(quoteDeposit);
      if (adminSignature) payload.adminSignature = adminSignature;

      await AxiosConfig.post(`/bookings/${id}/send-quote`, payload);
      showToast?.("Đã gửi báo giá và ký duyệt hợp đồng điện tử thành công!", "success");
      setQuoteModalOpen(false);
      fetchOrder();
      fetchContract(id);
    } catch (err) {
      showToast?.(err.response?.data?.message || "Lỗi gửi báo giá", "error");
    }
  };

  // Xác nhận cọc và Admin ký HĐ
  const handleConfirmDeposit = async () => {
    let signature = null;
    if (adminSigCanvasRef.current && hasAdminSignature) {
      try {
        signature = adminSigCanvasRef.current.toDataURL("image/png");
      } catch {
        // ignore
      }
    }

    // Nếu không vẽ chữ ký mới nhưng hợp đồng đã có chữ ký từ bước gửi báo giá
    if (!signature && contract?.adminSignatureImg) {
      signature = contract.adminSignatureImg;
    }

    if (!signature && !hasAdminSignature) {
      showToast?.("Vui lòng ký tên xác nhận trước khi gửi!", "error");
      return;
    }

    try {
      const res = await AxiosConfig.post(`/bookings/${id}/confirm-deposit`, {
        adminSignature: signature,
      });
      showToast?.(
        res.data?.message || "Đã xác nhận tiền cọc & ký duyệt hợp đồng thành công!",
        "success"
      );
      setConfirmDepositModal(false);
      fetchOrder();
      fetchContract(id);
    } catch (err) {
      showToast?.(err.response?.data?.message || "Lỗi xác nhận tiền cọc", "error");
    }
  };

  const status = order?.status;
  const isDepositPaid = order?.paymentStatus === "DEPOSIT_PAID" || order?.depositPaid;
  const isFullyPaid = Boolean(
    order?.paymentStatus === "FULLY_PAID" ||
      order?.finalPaid ||
      order?.status === "PAID_TO_STAFF" ||
      order?.status === "COMPLETED"
  );
  const isContractSignedByBoth = Boolean(contract?.adminSigned && contract?.customerSigned);

  // Phân quyền
  const canChangeSupervisor = ["PENDING", "SURVEY_ASSIGNED", "ACCEPTED", "SURVEYING"].includes(
    status
  );
  const isWorkStartedOrCompleted = [
    "PROCESSING",
    "WORKER_COMPLETED",
    "WAITING_FINAL_PAYMENT",
    "COMPLETED",
    "PAID_TO_STAFF",
  ].includes(status);
  const canAssignWorker = Boolean(
    isContractSignedByBoth &&
      (order?.depositPaid ||
        order?.paymentStatus === "DEPOSIT_PAID" ||
        ["DEPOSIT_CONFIRMED", "ASSIGNED"].includes(status)) &&
      !isWorkStartedOrCompleted
  );

  const orderServiceName = order?.serviceName || order?.service?.name || "";
  const surveyDetail = bookingDetails && bookingDetails.length > 0 ? bookingDetails[0] : null;
  const surveyImages = useMemo(() => {
    if (!surveyDetail?.surveyImages) return [];
    return parseImageUrls(surveyDetail.surveyImages);
  }, [surveyDetail?.surveyImages]);

  // Thợ đủ điều kiện
  const eligibleWorkers = useMemo(() => {
    return workers.filter((w) => {
      const isAvailable = w.available === true || w.available !== false;
      if (!isAvailable) return false;
      if (orderServiceName) {
        const specs = w.specialty ? w.specialty.toLowerCase() : "";
        const cleanSrv = orderServiceName.toLowerCase().trim();
        if (!specs.includes(cleanSrv) && !cleanSrv.includes(specs)) return false;
      }
      return true;
    });
  }, [workers, orderServiceName]);

  const districtWorkers = useMemo(() => {
    if (!projectDistrict) return eligibleWorkers;
    const cleanDistrict = projectDistrict
      .replace("Quận ", "")
      .replace("Huyện ", "")
      .replace("Thị xã ", "")
      .toLowerCase();
    return eligibleWorkers.filter((w) => w.serviceArea?.toLowerCase().includes(cleanDistrict));
  }, [eligibleWorkers, projectDistrict]);

  const idleWorkers = useMemo(() => {
    return eligibleWorkers.filter((w) => {
      const wId = String(w.userId || w.id);
      return (activeWorkerJobs[wId] || 0) === 0;
    });
  }, [eligibleWorkers, activeWorkerJobs]);

  const displayWorkers = useMemo(() => {
    let list = eligibleWorkers;
    if (workerModalTab === "district") list = districtWorkers;
    else if (workerModalTab === "idle") list = idleWorkers;

    return [...list].sort((a, b) => {
      const aId = String(a.userId || a.id);
      const bId = String(b.userId || b.id);
      const cleanDistrict = projectDistrict
        ? projectDistrict.replace("Quận ", "").replace("Huyện ", "").toLowerCase()
        : "";
      const aDistrictMatch = cleanDistrict && a.serviceArea?.toLowerCase().includes(cleanDistrict);
      const bDistrictMatch = cleanDistrict && b.serviceArea?.toLowerCase().includes(cleanDistrict);
      if (aDistrictMatch && !bDistrictMatch) return -1;
      if (!aDistrictMatch && bDistrictMatch) return 1;
      return (activeWorkerJobs[aId] || 0) - (activeWorkerJobs[bId] || 0);
    });
  }, [eligibleWorkers, districtWorkers, idleWorkers, workerModalTab, projectDistrict, activeWorkerJobs]);

  // Giám sát đủ điều kiện
  const eligibleSupervisors = useMemo(() => {
    return supervisors.filter((s) => s.available === true || s.available !== false);
  }, [supervisors]);

  const districtSupervisors = useMemo(() => {
    if (!projectDistrict) return eligibleSupervisors;
    const cleanDistrict = projectDistrict
      .replace("Quận ", "")
      .replace("Huyện ", "")
      .replace("Thị xã ", "")
      .toLowerCase();
    return eligibleSupervisors.filter((s) => s.serviceArea?.toLowerCase().includes(cleanDistrict));
  }, [eligibleSupervisors, projectDistrict]);

  const idleSupervisors = useMemo(() => {
    return eligibleSupervisors.filter((s) => {
      const sId = String(s.userId || s.id);
      return (activeSupervisorJobs[sId] || 0) === 0;
    });
  }, [eligibleSupervisors, activeSupervisorJobs]);

  const displaySupervisors = useMemo(() => {
    let list = eligibleSupervisors;
    if (supervisorModalTab === "district") list = districtSupervisors;
    else if (supervisorModalTab === "idle") list = idleSupervisors;

    return [...list].sort((a, b) => {
      const aId = String(a.userId || a.id);
      const bId = String(b.userId || b.id);
      const cleanDistrict = projectDistrict
        ? projectDistrict.replace("Quận ", "").replace("Huyện ", "").toLowerCase()
        : "";
      const aDistrictMatch = cleanDistrict && a.serviceArea?.toLowerCase().includes(cleanDistrict);
      const bDistrictMatch = cleanDistrict && b.serviceArea?.toLowerCase().includes(cleanDistrict);
      if (aDistrictMatch && !bDistrictMatch) return -1;
      if (!aDistrictMatch && bDistrictMatch) return 1;
      return (activeSupervisorJobs[aId] || 0) - (activeSupervisorJobs[bId] || 0);
    });
  }, [eligibleSupervisors, districtSupervisors, idleSupervisors, supervisorModalTab, projectDistrict, activeSupervisorJobs]);

  // Thù lao & Tài chính
  const totalAmt = Number(order?.totalAmount) || 0;
  const depositAmt = Number(order?.depositAmount) || totalAmt * 0.3;
  const remainingAmt = Math.max(0, totalAmt - depositAmt);
  const supervisorBaseFee = totalAmt * 0.1;
  const materialReimbursement = (dailyReports || []).reduce(
    (sum, r) => sum + (Number(r.materialCost) || 0),
    0
  );
  const supervisorFee = supervisorBaseFee + materialReimbursement;
  const supervisorSalary = salaryHistories.find(
    (s) => s.roleInBooking === "SURVEYOR" || s.role === "SURVEYOR"
  );
  const isSupervisorPaid = supervisorSalary?.paymentStatus === "PAID";

  const workerFee = totalAmt * 0.6;
  const workerSalary = salaryHistories.find(
    (s) =>
      s.roleInBooking === "TECHNICIAN" ||
      s.role === "TECHNICIAN" ||
      s.roleInBooking === "WORKER"
  );
  const isWorkerPaid = workerSalary?.paymentStatus === "PAID";

  const handleConfirmStaffPayout = async () => {
    if (!payoutModalData) return;
    try {
      setSubmittingPayout(true);
      const res = await AxiosConfig.post(
        `/payments/staff-payout?bookingId=${payoutModalData.orderId}&staffId=${payoutModalData.staffId}&role=${payoutModalData.role}`
      );
      showToast?.(
        res.data?.message || `Đã thanh toán thù lao thành công cho ${payoutModalData.staffName}`,
        "success"
      );
      setPayoutModalData(null);
      await fetchOrder();
      await fetchSalaryHistories(id);
    } catch (err) {
      showToast?.(err.response?.data?.message || "Lỗi khi xác nhận trả thù lao", "error");
    } finally {
      setSubmittingPayout(false);
    }
  };

  const negInfo = parseNegotiationInfo(order?.description);

  if (loading) return <LoadingSpinner />;
  if (!order) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200 max-w-lg mx-auto mt-10">
        <p className="text-slate-500 font-semibold text-xs">Không tìm thấy yêu cầu này.</p>
        <button
          onClick={() => navigate("/admin/bookings")}
          className="mt-4 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg text-xs"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-10">

      {/* 1. Header & Nút quay lại */}
      <div className="bg-white rounded-xl border border-slate-200 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate("/admin/bookings")}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer"
            title="Quay lại danh sách"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="font-mono font-bold text-xs bg-blue-600 text-white px-2 py-0.5 rounded">
            #{order.id}
          </span>
          <h2 className="text-sm sm:text-base font-bold text-slate-800 truncate">
            {order.serviceName || order.service?.name || "Yêu cầu dịch vụ sơn"}
          </h2>
          <StatusBadge status={status} />
        </div>

        {/* Hành động nhanh trên Header */}
        <div className="flex items-center gap-2">
          {contract && (
            <>
              <button
                type="button"
                onClick={() => setContractModalOpen(true)}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition flex items-center gap-1 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Xem Hợp đồng</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  exportContractPDF(contract, order);
                  showToast?.("Đã tải xuống file PDF hợp đồng thành công!", "success");
                }}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition flex items-center gap-1 cursor-pointer"
                title="Tải PDF hợp đồng"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Xuất PDF</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2. Dòng tóm tắt 4 ô quan trọng nhất (Quick Info Strip) - Đầy đủ thông tin, tránh lặp lại ở các tab */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 bg-white rounded-xl border border-slate-200 py-3.5 px-4 text-sm shadow-xs text-center">
        {/* Khách hàng */}
        <div className="p-2 flex flex-col justify-center items-center">
          <span className="text-xs text-slate-500 font-medium block">Khách hàng</span>
          <div className="font-bold text-slate-900 text-sm mt-0.5 truncate max-w-full">
            {order.customerName || "Khách hàng"}
          </div>
          {order.customerPhone && (
            <div className="flex items-center justify-center gap-1.5 mt-1">
              <a
                href={`tel:${order.customerPhone}`}
                className="text-blue-600 hover:text-blue-800 font-mono text-xs font-semibold flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 transition"
                title={`Gọi ${order.customerPhone}`}
              >
                <Phone className="w-3 h-3" />
                <span>{order.customerPhone}</span>
              </a>
              <button
                type="button"
                onClick={() => handleCopy(order.customerPhone, "phone")}
                className="p-1 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition cursor-pointer"
                title="Sao chép SĐT"
              >
                {copied === "phone" ? (
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Địa chỉ công trình */}
        <div className="p-2 flex flex-col justify-center items-center">
          <span className="text-xs text-slate-500 font-medium block">Địa chỉ công trình</span>
          <div className="flex items-center justify-center gap-1.5 mt-0.5 max-w-full">
            <span className="font-semibold text-slate-800 text-sm truncate max-w-[200px]" title={order.address}>
              {order.address || "—"}
            </span>
            {order.address && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address)}`}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:text-blue-800 bg-blue-50 p-1 rounded border border-blue-200 shrink-0 transition"
                title="Xem trên Google Maps"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
          {projectDistrict && (
            <span className="text-[11px] font-medium text-slate-500 block truncate mt-0.5">
              {projectDistrict}
            </span>
          )}
        </div>

        {/* Tổng dự toán */}
        <div className="p-2 flex flex-col justify-center items-center">
          <span className="text-xs text-slate-500 font-medium block">Tổng dự toán</span>
          <span className="font-bold text-slate-900 font-mono text-sm sm:text-base block mt-0.5">
            {totalAmt > 0 ? formatMoney(totalAmt) : "Chưa báo giá"}
          </span>
          {negInfo.hasNegotiation && negInfo.proposedPrice && (
            <span className="text-[11px] text-amber-600 font-medium block truncate mt-0.5" title={`Khách đề xuất: ${negInfo.proposedPrice}`}>
              Khách đề xuất: {negInfo.proposedPrice}
            </span>
          )}
        </div>

        {/* Tiến độ thanh toán */}
        <div className="p-2 flex flex-col justify-center items-center">
          <span className="text-xs text-slate-500 font-medium block">Tiến độ thanh toán</span>
          <span className="font-semibold text-sm block mt-0.5">
            {isFullyPaid ? (
              <span className="text-emerald-600 font-bold">✓ Đã tất toán 100%</span>
            ) : isDepositPaid ? (
              <span className="text-blue-600 font-bold">✓ Đã cọc 30%</span>
            ) : (
              <span className="text-amber-600 font-medium">Chờ cọc</span>
            )}
          </span>
        </div>
      </div>

      {/* 3. Banner Hành động ưu tiên tiếp theo (Gọn gàng & Trọng tâm) */}
      {status === "WAITING_ADMIN_QUOTE" && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-blue-900">
              Giám sát đã nộp kết quả khảo sát. Vui lòng lập và gửi báo giá cho khách hàng.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setQuoteModalOpen(true)}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition shrink-0 cursor-pointer shadow-sm"
          >
            Gửi báo giá ngay
          </button>
        </div>
      )}

      {(status === "WAITING_DEPOSIT" || (contract?.customerSigned && !contract?.adminSigned)) && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <PenTool className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-amber-900">
              {isDepositPaid
                ? "Khách đã chuyển cọc 30%! Admin vui lòng ký duyệt hợp đồng điện tử."
                : "Chờ khách đóng tiền cọc & xác nhận hợp đồng điện tử."}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setConfirmDepositModal(true)}
            className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition shrink-0 cursor-pointer shadow-sm"
          >
            {isDepositPaid ? "✍️ Ký duyệt hợp đồng cọc" : "Xác nhận cọc & Ký HĐ"}
          </button>
        </div>
      )}

      {negInfo.hasNegotiation && (
        <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs">
          <div className="space-y-0.5">
            <span className="font-bold text-amber-900 block">
              Khách hàng đề xuất thương lượng giá: {negInfo.proposedPrice || "Cần điều chỉnh"}
            </span>
            {negInfo.message && (
              <span className="text-amber-800 italic block">"{negInfo.message}"</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setQuoteModalOpen(true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-sm transition shrink-0 cursor-pointer"
          >
            Cập nhật lại báo giá
          </button>
        </div>
      )}

      {/* 4. Tiến trình công trình (OrderTimeline) */}
      <OrderTimeline status={status} />

      {/* 5. Tab chuyển đổi nội dung đơn giản (4 Tabs) */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="flex border-b border-slate-200 px-6 bg-slate-50 gap-6 text-sm font-semibold overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`py-3.5 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === "overview"
                ? "border-blue-600 text-blue-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Thông tin &amp; Khảo sát
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("staff")}
            className={`py-3.5 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === "staff"
                ? "border-blue-600 text-blue-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Điều phối nhân sự
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("reports")}
            className={`py-3.5 border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "reports"
                ? "border-blue-600 text-blue-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>Nhật ký thi công</span>
            {dailyReports.length > 0 && (
              <span className="bg-slate-200 text-slate-700 rounded-full px-2 py-0.5 text-xs font-bold">
                {dailyReports.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("contract")}
            className={`py-3.5 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === "contract"
                ? "border-blue-600 text-blue-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Hợp đồng &amp; Tài chính
          </button>
        </div>

        {/* 6. Nội dung chi tiết theo Tab */}
        <div className="p-6 text-sm space-y-5">

          {/* TAB 1: THÔNG TIN & KHẢO SÁT */}
          {activeTab === "overview" && (
            <div className="space-y-5">
              {/* Kế hoạch khảo sát & Yêu cầu thi công */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>Kế Hoạch Khảo Sát &amp; Yêu Cầu Thi Công</span>
                  </span>
                  {order.preferredSupervisorName && (
                    <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2.5 py-1 rounded-md">
                      Giám sát ưu tiên: @{order.preferredSupervisorName}
                    </span>
                  )}
                </div>

                {/* 4 Chỉ số kế hoạch (Lịch hẹn, Ngày tạo đơn, Dự kiến thi công, Thời hạn bảo hành) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                    <span className="text-xs text-slate-500 font-medium block">Lịch hẹn khảo sát</span>
                    <strong className="text-slate-900 text-sm block mt-1">
                      {order.appointmentDate ? formatDate(order.appointmentDate) : "Chưa hẹn"}
                      {order.appointmentTime && ` • ${order.appointmentTime.slice(0, 5)}`}
                    </strong>
                  </div>

                  <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                    <span className="text-xs text-slate-500 font-medium block">Thời gian tạo đơn</span>
                    <span className="text-slate-800 text-sm font-medium block mt-1">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString("vi-VN") : "Hôm nay"}
                    </span>
                  </div>

                  <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                    <span className="text-xs text-slate-500 font-medium block">Thời gian thi công dự kiến</span>
                    <strong className="text-slate-900 text-sm block mt-1">
                      {order.estimatedDays ? `${order.estimatedDays} ngày` : "Theo khảo sát"}
                    </strong>
                  </div>

                  <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                    <span className="text-xs text-slate-500 font-medium block">Thời hạn bảo hành</span>
                    <strong className="text-slate-900 text-sm block mt-1">
                      {order.warrantyYears ? `${order.warrantyYears} năm` : "Theo hợp đồng"}
                    </strong>
                  </div>
                </div>

                {/* Ghi chú / Yêu cầu ban đầu từ khách hàng */}
                <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-1.5">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block">
                    Ghi chú / Yêu cầu ban đầu của khách:
                  </span>
                  {order.description ? (
                    <p className="text-slate-800 italic leading-relaxed whitespace-pre-wrap text-sm">
                      "{order.description}"
                    </p>
                  ) : (
                    <p className="text-slate-400 italic text-sm">
                      Khách hàng không để lại ghi chú ban đầu.
                    </p>
                  )}
                </div>

                {/* Đề xuất thương lượng giá từ khách (nếu có) */}
                {negInfo.hasNegotiation && (
                  <div className="p-3.5 bg-amber-50 rounded-lg border border-amber-200 space-y-1 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-900 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Đề xuất thương lượng giá từ khách:</span>
                      </span>
                      <span className="font-mono font-bold text-amber-900">
                        {negInfo.proposedPrice || "Cần thỏa thuận"}
                      </span>
                    </div>
                    {negInfo.message && (
                      <p className="text-amber-800 italic text-xs leading-relaxed">
                        "{negInfo.message}"
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Báo cáo khảo sát hiện trường từ Giám sát */}
              <div className="border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4 bg-white shadow-xs">
                <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100 gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-slate-800 text-sm uppercase tracking-wider">
                      Biên Bản Khảo Sát Hiện Trường &amp; Dự Toán Vật Tư
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-slate-600">
                      Giám sát viên: <strong className="text-slate-900">@{order.supervisorName || order.surveyorName || "Chưa phân công"}</strong>
                    </span>
                    {surveyDetail?.supervisorAccepted && (
                      <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-md">
                        ✓ Đã duyệt hiện trạng
                      </span>
                    )}
                    {surveyDetail?.customerAccepted && (
                      <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2.5 py-1 rounded-md">
                        ✓ Khách đã đồng thuận
                      </span>
                    )}
                  </div>
                </div>

                {surveyDetail ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                        <span className="text-xs font-bold text-slate-700 block uppercase tracking-wide">
                          1. Hiện trạng màng sơn &amp; Đo đạc diện tích
                        </span>
                        <p className="text-slate-800 leading-relaxed whitespace-pre-wrap min-h-[65px] text-sm">
                          {surveyDetail.surveyNote || "Chưa có ghi chép khảo sát."}
                        </p>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                        <span className="text-xs font-bold text-slate-700 block uppercase tracking-wide">
                          2. Dự toán chủng loại vật tư &amp; Định mức sơn
                        </span>
                        <p className="text-slate-800 leading-relaxed whitespace-pre-wrap min-h-[65px] text-sm">
                          {surveyDetail.materialNote || "Chưa có ghi chép vật tư."}
                        </p>
                      </div>
                    </div>

                    {/* Vật tư phát sinh / thiếu hụt */}
                    {surveyDetail.materialShortage && (
                      <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 space-y-1.5 text-sm">
                        <span className="font-bold text-amber-900 flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Ghi chú vật tư phát sinh / thiếu hụt trong khảo sát:</span>
                        </span>
                        <p className="text-amber-900 whitespace-pre-wrap leading-relaxed">
                          {surveyDetail.materialShortage}
                        </p>
                      </div>
                    )}

                    {/* Danh sách ảnh hiện trường */}
                    {surveyImages.length > 0 && (
                      <div className="pt-3 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                            <Camera className="w-4 h-4 text-slate-500" />
                            <span>Ảnh chụp hiện trường ({surveyImages.length} ảnh):</span>
                          </span>
                          {surveyDetail.updatedAt && (
                            <span className="text-xs text-slate-500">
                              Cập nhật: {new Date(surveyDetail.updatedAt).toLocaleString("vi-VN")}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {surveyImages.map((url, idx) => (
                            <div
                              key={idx}
                              onClick={() => setPreviewImage(url)}
                              className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-slate-200 cursor-pointer hover:border-blue-500 transition group relative shadow-2xs"
                            >
                              <img
                                src={url}
                                alt={`survey-${idx}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition"
                              />
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                                <Maximize2 className="w-4 h-4" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-slate-400 italic py-4 text-center text-sm">
                    {order.supervisorId
                      ? "Giám sát viên đang tiến hành khảo sát hiện trường, chưa nộp báo cáo."
                      : "Chưa phân công giám sát viên để đi khảo sát đo đạc hiện trường."}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ĐIỀU PHỐI NHÂN SỰ */}
          {activeTab === "staff" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Giám sát viên */}
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <span className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      <span>Giám sát khảo sát (10%)</span>
                    </span>
                    {isSupervisorPaid ? (
                      <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-md">
                        ✓ Đã quyết toán
                      </span>
                    ) : (
                      <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2.5 py-1 rounded-md">
                        Chưa quyết toán
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Người phụ trách:</span>
                      <strong className="text-slate-900">
                        {order.supervisorName ? `@${order.supervisorName}` : "Chưa phân công"}
                      </strong>
                    </div>
                    {order.supervisorPhone && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">SĐT:</span>
                        <a href={`tel:${order.supervisorPhone}`} className="font-mono text-blue-600 font-medium">
                          {order.supervisorPhone}
                        </a>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-500">Thù lao giám sát (10%):</span>
                      <span className="font-mono font-bold text-slate-900 text-sm sm:text-base">
                        {formatMoney(supervisorFee)}
                      </span>
                    </div>
                  </div>

                  {canChangeSupervisor ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId(order.supervisorId ? String(order.supervisorId) : "");
                        setSupervisorModalTab("all");
                        setAssignModal("supervisor");
                      }}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition cursor-pointer"
                    >
                      {order.supervisorId ? "Đổi Giám Sát" : "+ Gán Giám Sát"}
                    </button>
                  ) : (
                    <div className="text-xs text-slate-400 text-center py-1">
                      Đã nộp báo cáo (Khóa đổi)
                    </div>
                  )}
                </div>

                {/* Đội thợ sơn */}
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <span className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-amber-600" />
                      <span>Đội thợ thi công (60%)</span>
                    </span>
                    {isWorkerPaid ? (
                      <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-md">
                        ✓ Đã quyết toán
                      </span>
                    ) : (
                      <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2.5 py-1 rounded-md">
                        Chưa quyết toán
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Đội trưởng phụ trách:</span>
                      <strong className="text-slate-900">
                        {order.technicianName ? `@${order.technicianName}` : "Chưa bàn giao"}
                      </strong>
                    </div>
                    {order.technicianPhone && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">SĐT:</span>
                        <a href={`tel:${order.technicianPhone}`} className="font-mono text-blue-600 font-medium">
                          {order.technicianPhone}
                        </a>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-500">Thù lao thợ (60%):</span>
                      <span className="font-mono font-bold text-slate-900 text-sm sm:text-base">
                        {formatMoney(workerFee)}
                      </span>
                    </div>
                  </div>

                  {canAssignWorker ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId(order.technicianId ? String(order.technicianId) : "");
                        setWorkerModalTab("all");
                        setAssignModal("worker");
                      }}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition cursor-pointer"
                    >
                      {order.technicianId ? "Đổi Đội Thợ" : "+ Gán Đội Thợ Sơn"}
                    </button>
                  ) : isWorkStartedOrCompleted ? (
                    <div className="text-xs text-slate-400 text-center py-1">
                      Đang/đã thi công (Khóa đổi)
                    </div>
                  ) : (
                    <div className="text-xs text-amber-700 text-center py-1">
                      Cần ký HĐ &amp; nộp cọc trước khi gán thợ
                    </div>
                  )}
                </div>
              </div>

              {/* Nút Quyết toán thù lao sang Payments */}
              {isFullyPaid && (!isSupervisorPaid || !isWorkerPaid) && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-sm">
                  <span className="text-emerald-900 font-semibold">
                    Khách đã thanh toán 100%. Vui lòng quyết toán thù lao cho Giám sát và Đội thợ.
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/admin/payments?tab=STAFF&search=${order.id}`, {
                        state: { tab: "STAFF", search: String(order.id) },
                      })
                    }
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition shrink-0 cursor-pointer shadow-sm flex items-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Quyết toán VietQR</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: NHẬT KÝ THI CÔNG */}
          {activeTab === "reports" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">
                  Tổng số: <strong className="text-slate-900">{dailyReports.length}</strong> ngày nộp nhật ký
                  {materialReimbursement > 0 && (
                    <span className="ml-2 text-amber-700 font-semibold">
                      (Vật tư phát sinh: {formatMoney(materialReimbursement)})
                    </span>
                  )}
                </span>
                {dailyReports.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setReportsModalOpen(true)}
                    className="text-blue-600 hover:underline text-sm font-semibold cursor-pointer"
                  >
                    Xem dạng cửa sổ lớn
                  </button>
                )}
              </div>

              {loadingReports ? (
                <div className="py-8 text-center text-slate-400">Đang tải nhật ký...</div>
              ) : dailyReports.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-400 text-sm">
                  Chưa có báo cáo nhật ký thi công nào được gửi.
                </div>
              ) : (
                <div className="space-y-3">
                  {dailyReports.map((report, index) => {
                    const reportImages = parseImageUrls(report.progressImages);
                    const itemCost = Number(report.materialCost) || 0;

                    return (
                      <div
                        key={report.id || index}
                        className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-sm"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">
                              Báo cáo #{dailyReports.length - index}
                            </span>
                            <span className="text-slate-500 text-xs sm:text-sm">
                              Lập bởi @{report.reporterName || "Nhân sự"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {report.progressPercentage != null && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold rounded text-xs">
                                {report.progressPercentage}%
                              </span>
                            )}
                            {itemCost > 0 && (
                              <span className="text-xs text-amber-700 font-semibold">
                                +{formatMoney(itemCost)}
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-slate-800 whitespace-pre-wrap leading-relaxed text-sm">{report.content}</p>

                        {report.materialShortage && (
                          <div className="text-sm text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                            Vật tư phát sinh: {report.materialShortage}
                          </div>
                        )}

                        {reportImages.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {reportImages.map((img, i) => (
                              <img
                                key={i}
                                src={img}
                                alt="progress"
                                onClick={() => setPreviewImage(img)}
                                className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover border border-slate-200 cursor-pointer hover:opacity-80 transition"
                              />
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

          {/* TAB 4: HỢP ĐỒNG & TÀI CHÍNH */}
          {activeTab === "contract" && (
            <div className="space-y-4">
              {/* Bảng phân bổ tài chính công trình */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3 text-sm">
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-600">Tổng dự toán hợp đồng:</span>
                  <strong className="font-mono text-sm sm:text-base text-slate-900 font-bold">{formatMoney(totalAmt)}</strong>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-600">Tiền cọc (30%):</span>
                  <span className="font-mono font-bold text-slate-800">{formatMoney(depositAmt)}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-600">Còn lại thanh toán khi nghiệm thu (70%):</span>
                  <span className="font-mono font-bold text-slate-800">{formatMoney(remainingAmt)}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-600">Thù lao Giám sát (10% + hoàn tiền VT):</span>
                  <span className="font-mono font-bold text-emerald-700">{formatMoney(supervisorFee)}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-600">Thù lao Đội thợ (60%):</span>
                  <span className="font-mono font-bold text-emerald-700">{formatMoney(workerFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Vận hành công ty &amp; Quỹ bảo hành sơn (30%):</span>
                  <span className="font-mono font-bold text-slate-800">{formatMoney(totalAmt * 0.3)}</span>
                </div>
              </div>

              {/* Hợp đồng điện tử */}
              <div className="border border-slate-200 rounded-xl p-5 space-y-3 bg-white">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div>
                    <span className="text-xs text-slate-500 block uppercase font-medium">Mã hợp đồng</span>
                    <span className="font-mono font-bold text-sm sm:text-base text-slate-900">
                      {contract?.contractCode || `HD-${order.id}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                        isContractSignedByBoth
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {isContractSignedByBoth
                        ? "Đã ký kết 2 bên"
                        : contract?.customerSigned
                        ? "Khách đã ký • Chờ Admin"
                        : "Chờ ký"}
                    </span>
                    {contract && (
                      <button
                        type="button"
                        onClick={() => setContractModalOpen(true)}
                        className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs sm:text-sm font-semibold hover:bg-blue-100 transition cursor-pointer"
                      >
                        Xem chi tiết HĐ
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl text-slate-800 text-sm font-mono max-h-52 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {contract?.content || "Hợp đồng sẽ được khởi tạo khi gửi báo giá."}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* 5 Modals chuyên biệt theo SRP */}
      <AssignStaffModal
        assignModal={assignModal}
        setAssignModal={setAssignModal}
        projectDistrict={projectDistrict}
        orderServiceName={order?.serviceName}
        supervisorModalTab={supervisorModalTab}
        setSupervisorModalTab={setSupervisorModalTab}
        workerModalTab={workerModalTab}
        setWorkerModalTab={setWorkerModalTab}
        eligibleSupervisors={eligibleSupervisors}
        districtSupervisors={districtSupervisors}
        idleSupervisors={idleSupervisors}
        displaySupervisors={displaySupervisors}
        eligibleWorkers={eligibleWorkers}
        districtWorkers={districtWorkers}
        idleWorkers={idleWorkers}
        displayWorkers={displayWorkers}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        activeSupervisorJobs={activeSupervisorJobs}
        activeWorkerJobs={activeWorkerJobs}
        handleAssign={handleAssign}
      />

      <SendQuoteModal
        quoteModalOpen={quoteModalOpen}
        setQuoteModalOpen={setQuoteModalOpen}
        order={order}
        contract={contract}
        quoteTotal={quoteTotal}
        setQuoteTotal={setQuoteTotal}
        quoteDeposit={quoteDeposit}
        setQuoteDeposit={setQuoteDeposit}
        quoteEstimatedDays={quoteEstimatedDays}
        setQuoteEstimatedDays={setQuoteEstimatedDays}
        quoteWarrantyYears={quoteWarrantyYears}
        setQuoteWarrantyYears={setQuoteWarrantyYears}
        handleSendQuote={handleSendQuote}
        showToast={showToast}
      />

      <AdminSignConfirmModal
        confirmDepositModal={confirmDepositModal}
        setConfirmDepositModal={setConfirmDepositModal}
        isDepositPaid={isDepositPaid}
        order={order}
        contract={contract}
        adminSigCanvasRef={adminSigCanvasRef}
        hasAdminSignature={hasAdminSignature}
        clearAdminSignature={clearAdminSignature}
        handleConfirmDeposit={handleConfirmDeposit}
      />

      <OrderDailyReportsModal
        reportsModalOpen={reportsModalOpen}
        setReportsModalOpen={setReportsModalOpen}
        dailyReports={dailyReports}
        setPreviewImage={setPreviewImage}
      />

      <OrderPayoutModal
        payoutModalData={payoutModalData}
        setPayoutModalData={setPayoutModalData}
        submittingPayout={submittingPayout}
        handleConfirmStaffPayout={handleConfirmStaffPayout}
      />

      <ContractModal
        isOpen={contractModalOpen}
        onClose={() => setContractModalOpen(false)}
        contract={contract}
        booking={order}
        role="admin"
        showToast={showToast}
      />

      {/* Shared Image Lightbox */}
      <ImageLightboxModal imageUrl={previewImage} onClose={() => setPreviewImage(null)} />
    </div>
  );
}