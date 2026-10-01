import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import AxiosConfig from "../../../util/AxiosConfig";
import StatusBadge from "../../../components/common/StatusBadge";
import LoadingSpinner from "../../../components/common/LoadingSpinner";
import OrderTimeline from "./OrderTimeline";
import Modal from "../../../components/common/Modal";
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
  CheckCircle,
  AlertCircle,
  FileText,
  Calendar,
  MapPin,
  Clock,
  Send,
  PenTool,
  ShieldCheck,
  User,
  Users,
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
  Paintbrush,
  Building2,
  ReceiptText,
  BadgePercent,
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

  // Phân công thợ cho từng hạng mục dịch vụ (Quan hệ N - N)
  const [assignServiceModal, setAssignServiceModal] = useState(null);
  const [selectedServiceWorkerId, setSelectedServiceWorkerId] = useState("");

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

  // Phân công Đội thợ cho từng Hạng mục Dịch vụ (Quan hệ N - N)
  const handleAssignWorkerToService = async () => {
    if (!assignServiceModal?.serviceItemId || !selectedServiceWorkerId) {
      showToast?.("Vui lòng chọn đội thợ cho dịch vụ", "error");
      return;
    }
    try {
      await AxiosConfig.post(
        `/bookings/${id}/services/${assignServiceModal.serviceItemId}/assign-technician`,
        {
          technicianId: Number(selectedServiceWorkerId),
        }
      );
      showToast?.(
        `Đã phân công đội thợ cho dịch vụ "${assignServiceModal.serviceName}"!`,
        "success"
      );
      setAssignServiceModal(null);
      setSelectedServiceWorkerId("");
      fetchOrder();
    } catch (err) {
      showToast?.(
        err.response?.data?.message || "Lỗi phân công thợ cho dịch vụ",
        "error"
      );
    }
  };

  // Báo giá & Ký hợp đồng Bên B (Pre-sign)
  const handleSendQuote = async (adminSignature, serviceItems = null) => {
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
      if (serviceItems && serviceItems.length > 0) {
        payload.serviceItems = serviceItems.map((item) => ({
          id: item.id,
          price: Number(item.price) || 0,
          estimatedArea: item.estimatedArea ? Number(item.estimatedArea) : null,
          note: item.note || "",
        }));
      }

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

  // Lấy đơn giá / thành tiền mà Admin đã báo giá cho từng dịch vụ
  const getItemQuotedPrice = useCallback(
    (item) => {
      if (!item) return 0;
      // 1. Giá cụ thể Admin đã nhập khi gửi báo giá (trong BookingServiceItem)
      if (item.price !== undefined && item.price !== null && Number(item.price) > 0) {
        return Number(item.price);
      }
      // 2. Nếu đơn chỉ có 1 gói dịch vụ (hoặc fallback) và đã có tổng báo giá từ Admin
      const activeServices = (order?.bookingServices || []).filter((s) => !s.cancelled);
      if (activeServices.length <= 1 && totalAmt > 0) {
        return totalAmt;
      }
      return 0;
    },
    [order?.bookingServices, totalAmt]
  );

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
    <div className="space-y-6 pb-12 w-full">

      {/* 1. Header & Nút quay lại */}
      <div className="bg-white rounded-xl border border-slate-200 px-5 py-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
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
          {isFullyPaid ? (
            <span className="text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-600" />
              <span>Đã tất toán 100%</span>
            </span>
          ) : isDepositPaid ? (
            <span className="text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-blue-600" />
              <span>Đã cọc 30%</span>
            </span>
          ) : null}
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
            <div className="space-y-6">
              {/* 1. Hồ Sơ Yêu Cầu & Địa Điểm Công Trình (Gọn gàng, đầy đủ, không trùng lặp) */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
                <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100 gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                        Hồ Sơ Yêu Cầu &amp; Địa Điểm Khảo Sát
                      </h3>
                      <p className="text-xs text-slate-500">
                        Thông tin khách hàng, vị trí thi công và kế hoạch triển khai
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {order.customerId && (
                      <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                        Mã KH: #{order.customerId}
                      </span>
                    )}
                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                      Tạo ngày: {order.createdAt ? new Date(order.createdAt).toLocaleDateString("vi-VN") : "Hôm nay"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Cột 1: Thông tin khách hàng & Ghi chú */}
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2.5">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        Người liên hệ
                      </span>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">Khách hàng:</span>
                          <strong className="text-slate-900 font-bold text-sm sm:text-base">
                            {order.customerName || "Khách hàng"}
                          </strong>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">Số điện thoại:</span>
                          {order.customerPhone ? (
                            <div className="flex items-center gap-2">
                              <a
                                href={`tel:${order.customerPhone}`}
                                className="text-blue-600 hover:text-blue-800 font-mono font-bold flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 hover:border-blue-300 transition shadow-2xs"
                                title={`Gọi ${order.customerPhone}`}
                              >
                                <Phone className="w-3.5 h-3.5 text-blue-500" />
                                <span>{order.customerPhone}</span>
                              </a>
                              <button
                                type="button"
                                onClick={() => handleCopy(order.customerPhone, "phone")}
                                className="p-1.5 text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition cursor-pointer shadow-2xs"
                                title="Sao chép SĐT"
                              >
                                {copied === "phone" ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Chưa cung cấp</span>
                          )}
                        </div>

                        {(order.customerEmail || order.email) && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-500">Email:</span>
                            <span className="font-mono text-slate-800 text-xs">
                              {order.customerEmail || order.email}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Ghi chú ban đầu của khách */}
                    <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-1.5">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        Ghi chú / Yêu cầu ban đầu từ khách
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
                  </div>

                  {/* Cột 2: Địa điểm công trình & Kế hoạch thời gian */}
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                          Địa điểm thi công
                        </span>
                        {projectDistrict && (
                          <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md">
                            {projectDistrict}
                          </span>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm font-semibold text-slate-900 leading-snug">
                          {order.address || "Chưa cung cấp địa chỉ"}
                        </div>

                        {order.address && (
                          <div className="flex items-center gap-2 pt-1">
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-600 font-semibold rounded-lg border border-slate-200 hover:border-blue-300 text-xs transition shadow-2xs"
                            >
                              <MapPin className="w-3.5 h-3.5 text-rose-500" />
                              <span>Mở Google Maps</span>
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </a>
                            <button
                              type="button"
                              onClick={() => handleCopy(order.address, "address")}
                              className="p-1.5 text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition cursor-pointer shadow-2xs"
                              title="Sao chép địa chỉ"
                            >
                              {copied === "address" ? (
                                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Kế hoạch khảo sát & Bảo hành */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-1">
                        <span className="text-slate-500 block">Lịch hẹn khảo sát:</span>
                        <strong className="text-slate-900 font-bold block text-sm">
                          {order.appointmentDate ? formatDate(order.appointmentDate) : "Chưa hẹn"}
                          {order.appointmentTime && ` • ${order.appointmentTime.slice(0, 5)}`}
                        </strong>
                        {order.preferredSupervisorName && (
                          <span className="text-[11px] text-blue-700 font-medium block">
                            (Ưu tiên GS: @{order.preferredSupervisorName})
                          </span>
                        )}
                      </div>

                      <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-1">
                        <span className="text-slate-500 block">Thời gian thi công &amp; Bảo hành:</span>
                        <strong className="text-slate-900 font-bold block text-sm">
                          {order.estimatedDays ? `${order.estimatedDays} ngày` : "Theo khảo sát"}
                          {` • Bảo hành ${order.warrantyYears || 2} năm`}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Danh sách các gói dịch vụ khách hàng đăng ký (CHỈ hiển thị tên gói và diện tích, không lặp lại thợ) */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                      <Paintbrush className="w-3.5 h-3.5 text-blue-600" />
                      <span>Hạng Mục Dịch Vụ Khách Hàng Đăng Ký ({order.bookingServices?.length || 1} gói):</span>
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(order.bookingServices && order.bookingServices.length > 0
                      ? order.bookingServices
                      : [{ id: 1, serviceName: order.serviceName || "Dịch vụ sơn chính" }]
                    ).map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 flex items-center gap-2"
                      >
                        <span className="w-4 h-4 rounded bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-slate-900">{item.serviceName}</span>
                        {item.estimatedArea && (
                          <span className="text-slate-500 font-mono text-[11px]">
                            ({item.estimatedArea} m²)
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
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
          {activeTab === "staff" && (() => {
            const bookingServicesList = order?.bookingServices || [];
            const hasMultipleServices = bookingServicesList.length > 0;
            const assignedServicesCount = bookingServicesList.filter((s) => s.technicianId).length;
            const totalServicesCount = hasMultipleServices ? bookingServicesList.length : (order?.technicianId ? 1 : 0);

            return (
              <div className="space-y-6">
                {/* Bố cục 2 Cột: Giám Sát Viên (Trái) & Đội Thợ Thi Công (Phải) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* CỘT TRÁI: GIÁM SÁT VIÊN (lg:col-span-5) */}
                  <div className="lg:col-span-5 space-y-4">
                    {/* Thẻ Giám Sát Viên Chính */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                      {/* Tiêu đề thẻ */}
                      <div className="px-5 py-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                            <ShieldCheck className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm">Giám Sát Viên (10%)</h4>
                            <p className="text-[11px] text-slate-500">Khảo sát &amp; nghiệm thu chất lượng</p>
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
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-2xs flex items-center gap-1.5"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>{order.supervisorId ? "Đổi Giám Sát" : "+ Phân Công"}</span>
                          </button>
                        ) : (
                          <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                            Khóa đổi (Đã nộp KS)
                          </span>
                        )}
                      </div>

                      {/* Nội dung Giám Sát */}
                      <div className="p-5 space-y-4">
                        {order.supervisorName ? (
                          <div className="space-y-4">
                            {/* Hồ sơ giám sát */}
                            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-blue-50/40 border border-blue-100">
                              <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold text-sm flex items-center justify-center shadow-xs shrink-0 ring-2 ring-white">
                                {order.supervisorName.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <h5 className="font-bold text-slate-900 text-sm truncate">
                                    @{order.supervisorName}
                                  </h5>
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                                    Giám sát trưởng
                                  </span>
                                </div>

                                {order.supervisorPhone ? (
                                  <div className="flex items-center gap-2 mt-1">
                                    <a
                                      href={`tel:${order.supervisorPhone}`}
                                      className="font-mono text-xs text-blue-700 font-semibold hover:underline flex items-center gap-1"
                                    >
                                      <Phone className="w-3 h-3 text-blue-500" />
                                      {order.supervisorPhone}
                                    </a>
                                    <button
                                      type="button"
                                      onClick={() => handleCopy(order.supervisorPhone, "sup_phone")}
                                      className="text-slate-400 hover:text-slate-700 transition cursor-pointer p-0.5"
                                      title="Sao chép SĐT"
                                    >
                                      {copied === "sup_phone" ? (
                                        <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-xs text-slate-400 italic">Chưa có số điện thoại</span>
                                )}
                              </div>
                            </div>

                            {/* Chi tiết tiến độ & tài chính giám sát */}
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <span className="text-slate-500 text-[11px] block">Tiến độ khảo sát</span>
                                <span className="font-bold mt-1 block">
                                  {surveyDetail?.supervisorAccepted ? (
                                    <span className="text-emerald-700 flex items-center gap-1">
                                      <CheckCircle2 className="w-3.5 h-3.5" /> Đã duyệt hiện trạng
                                    </span>
                                  ) : surveyDetail ? (
                                    <span className="text-blue-700 flex items-center gap-1">
                                      <Clock className="w-3.5 h-3.5" /> Đã nộp báo cáo
                                    </span>
                                  ) : (
                                    <span className="text-slate-500 flex items-center gap-1">
                                      <Clock className="w-3.5 h-3.5" /> Chưa có báo cáo
                                    </span>
                                  )}
                                </span>
                              </div>

                              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <span className="text-slate-500 text-[11px] block">Thù lao Giám Sát</span>
                                <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">
                                  {formatMoney(supervisorFee)}
                                </span>
                                {materialReimbursement > 0 && (
                                  <span className="text-[10px] text-emerald-600 block mt-0.5">
                                    +{formatMoney(materialReimbursement)} tiền vật tư
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Trạng thái chưa có Giám Sát */
                          <div className="text-center py-6 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2">
                              <ShieldCheck className="w-6 h-6" />
                            </div>
                            <h5 className="font-bold text-slate-800 text-sm">Chưa có Giám Sát Viên</h5>
                            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                              Vui lòng chỉ định Giám sát viên để tiến hành khảo sát thực tế, đo đạc và nghiệm thu công trình.
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedId("");
                                setSupervisorModalTab("all");
                                setAssignModal("supervisor");
                              }}
                              className="mt-3.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                            >
                              <UserCheck className="w-4 h-4" />
                              <span>+ Phân Công Giám Sát Ngay</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* CỘT PHẢI: PHÂN CÔNG THỢ CHO HẠNG MỤC DỊCH VỤ (lg:col-span-7) */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                      {/* Tiêu đề cột phải */}
                      <div className="px-5 py-4 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                            <Paintbrush className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-slate-900 text-sm">
                                Phân Công Thợ Thi Công Theo Hạng Mục
                              </h4>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                {hasMultipleServices ? `${assignedServicesCount}/${totalServicesCount} Gói đã gán` : `${totalServicesCount} Gói`}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500">
                              Phân bổ thợ chuyên trách cho từng hạng mục công trình (60% tổng dự toán)
                            </p>
                          </div>
                        </div>

                        {!canAssignWorker && (
                          <span className="text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                            {isWorkStartedOrCompleted
                              ? "Đang thi công (Khóa điều phối)"
                              : "Cần ký HĐ & cọc trước khi gán thợ"}
                          </span>
                        )}
                      </div>

                      {/* Danh sách các gói dịch vụ cần phân công */}
                      <div className="p-5">
                        {hasMultipleServices ? (
                          <div className="space-y-3">
                            {bookingServicesList.map((item, idx) => {
                              const quotedPrice = getItemQuotedPrice(item);
                              const isItemAssigned = Boolean(item.technicianId);

                              return (
                                <div
                                  key={item.id || idx}
                                  className={`rounded-xl border p-4 transition-all ${
                                    isItemAssigned
                                      ? "bg-slate-50/70 border-slate-200 hover:border-slate-300"
                                      : "bg-amber-50/30 border-amber-200/80 hover:border-amber-300"
                                  }`}
                                >
                                  {/* Dòng 1: Thông tin hạng mục & Đơn giá báo */}
                                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200/60">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <span className="w-6 h-6 rounded-md bg-slate-800 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                                        {String(idx + 1).padStart(2, "0")}
                                      </span>
                                      <div className="min-w-0">
                                        <h5 className="font-bold text-slate-900 text-sm truncate">
                                          {item.serviceName || `Gói dịch vụ #${idx + 1}`}
                                        </h5>
                                        {item.serviceCode && (
                                          <span className="text-[10px] font-mono text-slate-400">
                                            Mã gói: {item.serviceCode}
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Giá báo admin */}
                                    <div className="text-right shrink-0">
                                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                                        Giá báo (Admin)
                                      </span>
                                      <span className="font-mono font-bold text-sm text-slate-900 block">
                                        {quotedPrice > 0 ? (
                                          formatMoney(quotedPrice)
                                        ) : totalAmt > 0 && bookingServicesList.length === 1 ? (
                                          formatMoney(totalAmt)
                                        ) : (
                                          <span className="text-amber-600 text-xs font-medium">Chờ duyệt giá</span>
                                        )}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Dòng 2: Thông tin thợ phụ trách & Nút điều phối */}
                                  <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    {isItemAssigned ? (
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0 ring-1 ring-emerald-200">
                                          {item.technicianName?.charAt(0).toUpperCase() || "T"}
                                        </div>
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-900 text-xs">
                                              @{item.technicianName}
                                            </span>
                                            {item.technicianCompleted ? (
                                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                                                ✓ Đã xong việc
                                              </span>
                                            ) : (
                                              <span className="text-[10px] bg-blue-100 text-blue-800 font-medium px-1.5 py-0.5 rounded">
                                                Đang thực hiện
                                              </span>
                                            )}
                                          </div>
                                          {item.technicianPhone && (
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                              <a
                                                href={`tel:${item.technicianPhone}`}
                                                className="text-[11px] font-mono text-slate-500 hover:text-blue-600 flex items-center gap-1"
                                              >
                                                <Phone className="w-2.5 h-2.5" />
                                                {item.technicianPhone}
                                              </a>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2 text-xs text-amber-700 font-medium">
                                        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                                        <span>Chưa gán thợ cho gói này</span>
                                      </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                                      {item.id && canAssignWorker && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setAssignServiceModal({
                                              serviceItemId: item.id,
                                              serviceName: item.serviceName,
                                              currentTechId: item.technicianId,
                                            });
                                            setSelectedServiceWorkerId(
                                              item.technicianId ? String(item.technicianId) : ""
                                            );
                                          }}
                                          className={`px-3 py-1.5 font-bold rounded-lg text-xs transition cursor-pointer shadow-2xs flex items-center gap-1.5 ${
                                            isItemAssigned
                                              ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                                              : "bg-amber-600 hover:bg-amber-700 text-white"
                                          }`}
                                        >
                                          <Paintbrush className="w-3.5 h-3.5" />
                                          <span>{isItemAssigned ? "Đổi thợ" : "+ Gán Thợ"}</span>
                                        </button>
                                      )}

                                      {item.id && isFullyPaid && item.technicianId && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            navigate(`/admin/payments?tab=STAFF&search=${order.id}`, {
                                              state: { tab: "STAFF", search: String(order.id) },
                                            })
                                          }
                                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                                        >
                                          <CreditCard className="w-3.5 h-3.5" />
                                          <span>Chi trả</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          /* Trường hợp đơn lẻ 1 dịch vụ cũ */
                          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                Thợ thi công chính
                              </div>
                              <div className="text-sm font-bold text-slate-900">
                                {order.technicianName ? `@${order.technicianName}` : "Chưa bàn giao cho thợ"}
                              </div>
                              {order.technicianPhone && (
                                <div className="text-xs text-slate-500 font-mono">
                                  SĐT: <a href={`tel:${order.technicianPhone}`} className="text-blue-600 font-bold">{order.technicianPhone}</a>
                                </div>
                              )}
                            </div>
                            {canAssignWorker ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedId(order.technicianId ? String(order.technicianId) : "");
                                  setWorkerModalTab("all");
                                  setAssignModal("worker");
                                }}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-xs flex items-center gap-1.5"
                              >
                                <Paintbrush className="w-3.5 h-3.5" />
                                <span>{order.technicianId ? "Đổi Đội Thợ" : "+ Gán Đội Thợ Sơn"}</span>
                              </button>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Banner Quyết toán thù lao sang Payments khi khách đã tất toán */}
                {isFullyPaid && (!isSupervisorPaid || !isWorkerPaid) && (
                  <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <strong className="text-emerald-950 font-bold block">
                          Khách hàng đã hoàn tất thanh toán 100% công trình!
                        </strong>
                        <span className="text-xs text-emerald-800">
                          Hệ thống đã tự động xuất QR VietQR và số tài khoản ngân hàng để chi trả thù lao cho Giám sát và Đội thợ.
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/admin/payments?tab=STAFF&search=${order.id}`, {
                          state: { tab: "STAFF", search: String(order.id) },
                        })
                      }
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm transition shrink-0 cursor-pointer shadow-sm flex items-center gap-2"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Quyết toán VietQR ngay</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })()}

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
            <div className="space-y-6">
              {/* 1. Bảng kê chi tiết các hạng mục dịch vụ & Chi phí */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <ReceiptText className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        Bảng Kê Chi Tiết Các Loại Phí Dịch Vụ
                      </h4>
                      <p className="text-xs text-slate-500">
                        Toàn bộ danh mục dịch vụ đăng ký và dự toán chi phí hợp đồng
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                    Tổng: {formatMoney(totalAmt)}
                  </span>
                </div>

                {/* Table chi tiết */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs uppercase font-semibold">
                        <th className="py-2.5 px-3 rounded-l-lg">STT</th>
                        <th className="py-2.5 px-3">Hạng mục / Dịch vụ</th>
                        <th className="py-2.5 px-3">Đội thợ thực hiện</th>
                        <th className="py-2.5 px-3 text-center">Nghiệm thu</th>
                        <th className="py-2.5 px-3 text-right rounded-r-lg">Đơn giá báo (Admin)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(order.bookingServices && order.bookingServices.length > 0
                        ? order.bookingServices
                        : [
                            {
                              id: 1,
                              serviceName: order.serviceName || order.service?.name || "Dịch vụ sơn chính",
                              price: order.totalAmount,
                              technicianName: order.technicianName,
                              technicianCompleted: false,
                              supervisorAccepted: false,
                            },
                          ]
                      ).map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-slate-50/50">
                          <td className="py-3 px-3 font-mono text-slate-400 font-bold">{idx + 1}</td>
                          <td className="py-3 px-3 font-semibold text-slate-900">{item.serviceName}</td>
                          <td className="py-3 px-3">
                            {item.technicianName ? (
                              <span className="text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded text-xs">
                                @{item.technicianName}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic text-xs">Chưa gán</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {item.supervisorAccepted ? (
                              <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                                ✓ Đã nghiệm thu
                              </span>
                            ) : item.technicianCompleted ? (
                              <span className="text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded text-[11px]">
                                Thợ xong việc
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">Đang thực hiện</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                            {getItemQuotedPrice(item) > 0 ? (
                              formatMoney(getItemQuotedPrice(item))
                            ) : totalAmt > 0 && (order.bookingServices?.length || 1) === 1 ? (
                              formatMoney(totalAmt)
                            ) : (
                              <span className="text-amber-600 font-medium text-xs">Chờ báo giá</span>
                            )}
                          </td>
                        </tr>
                      ))}

                      {/* Chi phí vật tư hoàn trả nếu có */}
                      {materialReimbursement > 0 && (
                        <tr className="bg-amber-50/50">
                          <td className="py-3 px-3 font-mono text-amber-600 font-bold">+</td>
                          <td className="py-3 px-3 font-medium text-amber-900" colSpan={3}>
                            <div>Hoàn trả chi phí mua bổ sung vật tư phát sinh tại công trường</div>
                            <div className="text-[11px] text-amber-700 italic">
                              (Căn cứ theo hóa đơn và nhật ký thi công thực tế từ Giám sát viên)
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-amber-800">
                            +{formatMoney(materialReimbursement)}
                          </td>
                        </tr>
                      )}

                      {/* Dòng tổng cộng */}
                      <tr className="bg-slate-50 font-bold text-slate-900 border-t border-slate-200">
                        <td className="py-3 px-3 rounded-l-lg" colSpan={4}>
                          TỔNG GIÁ TRỊ HỢP ĐỒNG / DỰ TOÁN CÔNG TRÌNH:
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-base text-blue-700 rounded-r-lg">
                          {formatMoney(totalAmt)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 2. Lộ trình & Tiến độ thanh toán của khách hàng */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Đợt 1: Cọc 30% */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                      Đợt 1 • Đặt cọc triển khai (30%)
                    </span>
                    {isDepositPaid ? (
                      <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-md">
                        ✓ Đã thanh toán
                      </span>
                    ) : (
                      <span className="text-xs font-medium bg-amber-100 text-amber-800 px-2.5 py-1 rounded-md">
                        Chờ khách cọc
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-xs text-slate-500">Số tiền đặt cọc:</span>
                    <strong className="font-mono text-lg font-bold text-slate-900">
                      {formatMoney(depositAmt)}
                    </strong>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed pt-1 border-t border-slate-100">
                    Khách hàng thanh toán qua cổng VNPay sau khi thống nhất báo giá và ký hợp đồng điện tử.
                  </p>
                </div>

                {/* Đợt 2: Tất toán 70% */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                      Đợt 2 • Nghiệm thu &amp; Tất toán (70%)
                    </span>
                    {isFullyPaid ? (
                      <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-md">
                        ✓ Đã tất toán 100%
                      </span>
                    ) : status === "WAITING_FINAL_PAYMENT" ? (
                      <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2.5 py-1 rounded-md">
                        Chờ khách tất toán
                      </span>
                    ) : (
                      <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md">
                        Chờ nghiệm thu
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-xs text-slate-500">Số tiền tất toán còn lại:</span>
                    <strong className="font-mono text-lg font-bold text-slate-900">
                      {formatMoney(remainingAmt)}
                    </strong>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed pt-1 border-t border-slate-100">
                    Khách hàng thanh toán 70% giá trị còn lại sau khi giám sát và khách nghiệm thu đạt chuẩn.
                  </p>
                </div>
              </div>

              {/* 3. Cơ cấu phân bổ thù lao & Quỹ công ty */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      <BadgePercent className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        Cơ Cấu Phân Bổ Doanh Thu &amp; Thù Lao Nhân Sự
                      </h4>
                      <p className="text-xs text-slate-500">
                        Định mức trích thưởng và chi trả cho nhân sự theo quy chế công ty
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  {/* Giám sát 10% */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600 uppercase">1. Giám Sát Viên</span>
                      <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">10%</span>
                    </div>
                    <div className="font-mono font-bold text-base text-slate-900">
                      {formatMoney(supervisorFee)}
                    </div>
                    <div className="text-xs text-slate-500 space-y-0.5 pt-1 border-t border-slate-200">
                      <div>Định mức 10%: {formatMoney(supervisorBaseFee)}</div>
                      {materialReimbursement > 0 && (
                        <div className="text-emerald-700">Hoàn tiền VT: +{formatMoney(materialReimbursement)}</div>
                      )}
                      <div className="pt-1 font-semibold">
                        {isSupervisorPaid ? (
                          <span className="text-emerald-600">✓ Đã chi trả</span>
                        ) : (
                          <span className="text-amber-600">⏳ Chưa chi trả</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Đội thợ 60% */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600 uppercase">2. Đội Thợ Sơn</span>
                      <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">60%</span>
                    </div>
                    <div className="font-mono font-bold text-base text-slate-900">
                      {formatMoney(workerFee)}
                    </div>
                    <div className="text-xs text-slate-500 space-y-0.5 pt-1 border-t border-slate-200">
                      <div>Phân bổ cho các thợ thực hiện gói</div>
                      <div className="pt-1 font-semibold">
                        {isWorkerPaid ? (
                          <span className="text-emerald-600">✓ Đã chi trả</span>
                        ) : (
                          <span className="text-amber-600">⏳ Chưa chi trả</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Công ty 30% */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600 uppercase">3. Vận Hành &amp; Bảo Hành</span>
                      <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">30%</span>
                    </div>
                    <div className="font-mono font-bold text-base text-slate-900">
                      {formatMoney(totalAmt * 0.3)}
                    </div>
                    <div className="text-xs text-slate-500 space-y-0.5 pt-1 border-t border-slate-200">
                      <div>Phí quản lý hệ thống</div>
                      <div>Quỹ bảo hành {order.warrantyYears || 2} năm</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Hợp đồng điện tử */}
              <div className="border border-slate-200 rounded-2xl p-5 space-y-3 bg-white shadow-xs">
                <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-200 gap-3">
                  <div>
                    <span className="text-xs text-slate-500 block uppercase font-medium">Mã hợp đồng điện tử</span>
                    <span className="font-mono font-bold text-sm sm:text-base text-slate-900">
                      {contract?.contractCode || `HD-${order.id}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`px-3 py-1 rounded-md text-xs font-bold ${
                        isContractSignedByBoth
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {isContractSignedByBoth
                        ? "✓ Đã ký kết 2 bên"
                        : contract?.customerSigned
                        ? "Khách đã ký • Chờ Admin"
                        : "Chờ ký kết"}
                    </span>
                    {contract && (
                      <>
                        <button
                          type="button"
                          onClick={() => setContractModalOpen(true)}
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 transition cursor-pointer"
                        >
                          Xem chi tiết HĐ
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            exportContractPDF(contract, order);
                            showToast?.("Đã tải xuống file PDF hợp đồng thành công!", "success");
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition flex items-center gap-1 cursor-pointer"
                          title="Tải PDF hợp đồng"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-500" />
                          <span>Xuất PDF</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl text-slate-800 text-sm font-mono max-h-52 overflow-y-auto whitespace-pre-wrap leading-relaxed border border-slate-200/80">
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

      {/* Modal Phân công Đội thợ cho từng Hạng mục Dịch vụ */}
      {assignServiceModal && (
        <Modal
          isOpen={!!assignServiceModal}
          onClose={() => setAssignServiceModal(null)}
          title={`Phân công đội thợ cho: ${assignServiceModal.serviceName}`}
          size="md"
        >
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed">
              💡 Chọn đội thợ thi công chuyên trách cho gói dịch vụ:{" "}
              <strong>{assignServiceModal.serviceName}</strong>.
            </div>

            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {workers.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">
                  Không có thợ thi công khả dụng
                </p>
              ) : (
                workers.map((w) => {
                  const wId = String(w.userId || w.id);
                  const isSelected = String(selectedServiceWorkerId) === wId;
                  const username = w.user?.username || w.username || `Thợ #${wId}`;
                  const phone = w.user?.phoneNumber || w.phoneNumber;
                  return (
                    <div
                      key={wId}
                      onClick={() => setSelectedServiceWorkerId(wId)}
                      className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "border-[#1E3A8A] bg-blue-50/70 shadow-xs ring-2 ring-[#1E3A8A]/15"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#1E3A8A] font-bold text-xs flex items-center justify-center shrink-0">
                          {username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">
                            @{username}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                            {w.specialty && <span>Chuyên môn: {w.specialty}</span>}
                            {phone && <span>• SĐT: {phone}</span>}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? "border-[#1E3A8A] bg-[#1E3A8A] text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAssignServiceModal(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-50 transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleAssignWorkerToService}
                disabled={!selectedServiceWorkerId}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition cursor-pointer disabled:opacity-50 shadow-xs"
              >
                Xác nhận phân công
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}