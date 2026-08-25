import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import AxiosConfig from "../../../util/AxiosConfig";
import DashboardHeader from "../../../components/layout/DashboardHeader";
import StatusBadge from "../../../components/common/StatusBadge";
import LoadingSpinner from "../../../components/common/LoadingSpinner";
import Modal from "../../../components/common/Modal";
import QRCodePayment from "../../../components/common/QRCodePayment";
import OrderTimeline from "./OrderTimeline";
import OrderActionBanner from "../../../components/common/OrderActionBanner";
import SurveyReportCard from "../../../components/common/SurveyReportCard";
import ContractModal from "../../../components/common/ContractModal";
import ImageLightboxModal from "../../../components/common/ImageLightboxModal";
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
  Building,
  Check,
  Sparkles,
  ArrowLeft,
  Printer,
  Download,
  DollarSign,
  QrCode,
} from "lucide-react";
import { exportContractPDF } from "../../../util/contractPdfExport";
import { formatMoney } from "../../../util/formatters";
import { getVietQRBankCode, parseNegotiationInfo } from "../../../util/orderFlowUtils";

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
  const [workerModalTab, setWorkerModalTab] = useState("all"); // 'all' | 'district' | 'idle'
  const [supervisorModalTab, setSupervisorModalTab] = useState("all"); // 'all' | 'district' | 'idle'

  // Deposit Confirm & Admin Sign
  const [confirmDepositModal, setConfirmDepositModal] = useState(false);
  const adminSigCanvasRef = useRef(null);
  const [hasAdminSignature, setHasAdminSignature] = useState(false);

  // Payments
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

  const formatMoney = (value) => {
    if (value == null || value === "") return "—";
    return Number(value).toLocaleString("vi-VN") + " đ";
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
      const list = Array.isArray(res.data) ? res.data : (res.data?.content || []);
      const filtered = list.filter((s) => Number(s.bookingId || s.booking?.id) === Number(bookingId));
      setSalaryHistories(filtered);
    } catch (e) {
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
  }, [id, fetchBookingDetail, fetchContract, fetchDailyReports, fetchPayments, fetchSalaryHistories, showToast]);

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

  // Extract District of Customer Order Address
  const projectDistrict = useMemo(() => {
    if (!order?.address) return "";
    const parsed = parseHanoiAddress(order.address);
    return parsed.district || "";
  }, [order?.address]);

  // Phân công Giám sát (POST /api/bookings/{id}/assign-supervisor)
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
      showToast?.(
        err.response?.data?.message || "Lỗi phân công giám sát",
        "error"
      );
    }
  };

  // Phân công Đội thợ (POST /api/bookings/{id}/assign-team)
  const handleAssignWorker = async () => {
    const targetWorkerId =
      selectedId ||
      order?.preferredTechnicianId ||
      order?.preferredTechnician?.id;

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
      showToast?.(
        err.response?.data?.message || "Lỗi giao đơn cho đội thợ",
        "error"
      );
    }
  };

  // Tổng hợp phân công Giám sát / Đội thợ
  const handleAssign = async () => {
    if (assignModal === "supervisor") {
      await handleAssignSupervisor();
    } else {
      await handleAssignWorker();
    }
  };

  // Cập nhật trạng thái Booking
  const handleUpdateStatus = async (newStatus) => {
    try {
      await AxiosConfig.put(`/bookings/${id}`, { ...order, status: newStatus });
      showToast?.("Cập nhật trạng thái thành công!", "success");
      fetchOrder();
    } catch (err) {
      showToast?.(err.response?.data?.message || "Lỗi cập nhật trạng thái", "error");
    }
  };

  // Tạo hợp đồng
  const handleCreateContract = async () => {
    try {
      await AxiosConfig.post(`/contracts`, {
        bookingId: Number(id),
        content: `Hợp đồng thi công cho đơn ${id}\nTổng tiền: ${order.totalAmount || 0} VNĐ\nTiền cọc: ${order.depositAmount || 0} VNĐ`,
      });
      showToast?.("Đã lập hợp đồng thành công, chờ khách ký!", "success");
      fetchOrder();
      fetchContract(id);
    } catch (err) {
      showToast?.(err.response?.data?.message || "Lỗi tạo hợp đồng", "error");
    }
  };

  // Báo giá
  const handleSendQuote = async () => {
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

      await AxiosConfig.post(`/bookings/${id}/send-quote`, payload);
      showToast?.("Đã gửi báo giá và lập hợp đồng chi tiết cho khách hàng!", "success");
      setQuoteModalOpen(false);
      fetchOrder();
    } catch (err) {
      showToast?.(err.response?.data?.message || "Lỗi gửi báo giá", "error");
    }
  };

  // Xác nhận cọc và Admin ký HĐ
  const handleConfirmDeposit = async () => {
    if (!hasAdminSignature) {
      showToast?.("Vui lòng ký tên xác nhận trước khi gửi!", "error");
      return;
    }

    let signature = null;
    if (adminSigCanvasRef.current) {
      try {
        signature = adminSigCanvasRef.current.toDataURL("image/png");
      } catch (e) {
        // ignore
      }
    }

    try {
      await AxiosConfig.post(`/bookings/${id}/confirm-deposit`, {
        adminSignature: signature,
      });
      showToast?.("Đã xác nhận tiền cọc & ký duyệt hợp đồng thành công!", "success");
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

  // Chỉ cho phép gán/đổi Giám sát khi đơn chưa khảo sát xong & chưa nộp báo cáo
  const canChangeSupervisor = ["PENDING", "SURVEY_ASSIGNED", "ACCEPTED", "SURVEYING"].includes(status);

  // Đơn đã bắt đầu thi công hoặc đã hoàn tất
  const isWorkStartedOrCompleted = ["PROCESSING", "WORKER_COMPLETED", "WAITING_FINAL_PAYMENT", "COMPLETED", "PAID_TO_STAFF"].includes(status);

  // Điều kiện để phân công / đổi thợ thi công: Admin VÀ Khách đều PHẢI ký hợp đồng & đã cọc tiền & CHƯA bắt đầu thi công
  const canAssignWorker = Boolean(
    isContractSignedByBoth &&
    (order?.depositPaid || order?.paymentStatus === "DEPOSIT_PAID" || ["DEPOSIT_CONFIRMED", "ASSIGNED"].includes(status)) &&
    !isWorkStartedOrCompleted
  );

  const orderServiceName = order?.serviceName || order?.service?.name || "";

  // Báo cáo khảo sát từ Giám sát viên
  const surveyDetail = bookingDetails && bookingDetails.length > 0 ? bookingDetails[0] : null;
  const surveyImages = useMemo(() => {
    if (!surveyDetail?.surveyImages) return [];
    return parseImageUrls(surveyDetail.surveyImages);
  }, [surveyDetail?.surveyImages]);

  // 1. Chỉ thợ CÙNG DỊCH VỤ khách chọn và ĐANG BẬT TRẠNG THÁI HOẠT ĐỘNG
  const eligibleWorkers = useMemo(() => {
    return workers.filter((w) => {
      // Phải bật trạng thái hoạt động
      const isAvailable = w.available === true || w.available !== false;
      if (!isAvailable) return false;

      // Cùng chuyên môn dịch vụ khách chọn
      if (orderServiceName) {
        const specs = w.specialty ? w.specialty.toLowerCase() : "";
        const cleanSrv = orderServiceName.toLowerCase().trim();
        if (!specs.includes(cleanSrv) && !cleanSrv.includes(specs)) {
          return false;
        }
      }
      return true;
    });
  }, [workers, orderServiceName]);

  // Thợ cùng khu vực
  const districtWorkers = useMemo(() => {
    if (!projectDistrict) return eligibleWorkers;
    const cleanDistrict = projectDistrict.replace("Quận ", "").replace("Huyện ", "").replace("Thị xã ", "").toLowerCase();
    return eligibleWorkers.filter((w) => w.serviceArea?.toLowerCase().includes(cleanDistrict));
  }, [eligibleWorkers, projectDistrict]);

  // Thợ đang rảnh (0 đơn đang làm)
  const idleWorkers = useMemo(() => {
    return eligibleWorkers.filter((w) => {
      const wId = String(w.userId || w.id);
      return (activeWorkerJobs[wId] || 0) === 0;
    });
  }, [eligibleWorkers, activeWorkerJobs]);

  // Danh sách thợ hiển thị theo tab đã chọn
  const displayWorkers = useMemo(() => {
    let list = eligibleWorkers;
    if (workerModalTab === "district") list = districtWorkers;
    else if (workerModalTab === "idle") list = idleWorkers;

    // Sắp xếp ưu tiên cùng khu vực và rảnh
    return [...list].sort((a, b) => {
      const aId = String(a.userId || a.id);
      const bId = String(b.userId || b.id);
      const aDistrictMatch = projectDistrict && a.serviceArea?.toLowerCase().includes(projectDistrict.replace("Quận ", "").replace("Huyện ", "").toLowerCase());
      const bDistrictMatch = projectDistrict && b.serviceArea?.toLowerCase().includes(projectDistrict.replace("Quận ", "").replace("Huyện ", "").toLowerCase());
      if (aDistrictMatch && !bDistrictMatch) return -1;
      if (!aDistrictMatch && bDistrictMatch) return 1;

      const aLoad = activeWorkerJobs[aId] || 0;
      const bLoad = activeWorkerJobs[bId] || 0;
      return aLoad - bLoad;
    });
  }, [eligibleWorkers, districtWorkers, idleWorkers, workerModalTab, projectDistrict, activeWorkerJobs]);

  // 1. Chỉ Giám sát ĐANG BẬT TRẠNG THÁI HOẠT ĐỘNG
  const eligibleSupervisors = useMemo(() => {
    return supervisors.filter((s) => {
      return s.available === true || s.available !== false;
    });
  }, [supervisors]);

  // Giám sát cùng khu vực
  const districtSupervisors = useMemo(() => {
    if (!projectDistrict) return eligibleSupervisors;
    const cleanDistrict = projectDistrict
      .replace("Quận ", "")
      .replace("Huyện ", "")
      .replace("Thị xã ", "")
      .toLowerCase();
    return eligibleSupervisors.filter((s) =>
      s.serviceArea?.toLowerCase().includes(cleanDistrict)
    );
  }, [eligibleSupervisors, projectDistrict]);

  // Giám sát đang rảnh (0 đơn đang làm)
  const idleSupervisors = useMemo(() => {
    return eligibleSupervisors.filter((s) => {
      const sId = String(s.userId || s.id);
      return (activeSupervisorJobs[sId] || 0) === 0;
    });
  }, [eligibleSupervisors, activeSupervisorJobs]);

  // Danh sách giám sát hiển thị theo tab đã chọn
  const displaySupervisors = useMemo(() => {
    let list = eligibleSupervisors;
    if (supervisorModalTab === "district") list = districtSupervisors;
    else if (supervisorModalTab === "idle") list = idleSupervisors;

    return [...list].sort((a, b) => {
      const aId = String(a.userId || a.id);
      const bId = String(b.userId || b.id);
      const cleanDistrict = projectDistrict
        ? projectDistrict.replace("Quận ", "").replace("Huyện ", "").replace("Thị xã ", "").toLowerCase()
        : "";
      const aDistrictMatch = cleanDistrict && a.serviceArea?.toLowerCase().includes(cleanDistrict);
      const bDistrictMatch = cleanDistrict && b.serviceArea?.toLowerCase().includes(cleanDistrict);
      if (aDistrictMatch && !bDistrictMatch) return -1;
      if (!aDistrictMatch && bDistrictMatch) return 1;

      const aLoad = activeSupervisorJobs[aId] || 0;
      const bLoad = activeSupervisorJobs[bId] || 0;
      return aLoad - bLoad;
    });
  }, [
    eligibleSupervisors,
    districtSupervisors,
    idleSupervisors,
    supervisorModalTab,
    projectDistrict,
    activeSupervisorJobs,
  ]);

  // Thù lao nhân sự & xử lý thanh toán (Tỷ lệ: Admin 30% · Giám sát 10%+VT · Kỹ thuật 60%)
  const totalAmt = Number(order?.totalAmount) || 0;
  const adminFee = totalAmt * 0.30;
  const supervisorBaseFee = totalAmt * 0.10;
  const materialReimbursement = (dailyReports || []).reduce(
    (sum, r) => sum + (Number(r.materialCost) || 0),
    0
  );
  const supervisorFee = supervisorBaseFee + materialReimbursement;
  const supervisorSalary = salaryHistories.find((s) => s.roleInBooking === "SURVEYOR" || s.role === "SURVEYOR");
  const isSupervisorPaid = supervisorSalary?.paymentStatus === "PAID";

  const workerFee = totalAmt * 0.60;
  const workerSalary = salaryHistories.find(
    (s) => s.roleInBooking === "TECHNICIAN" || s.role === "TECHNICIAN" || s.roleInBooking === "WORKER"
  );
  const isWorkerPaid = workerSalary?.paymentStatus === "PAID";

  const handleOpenStaffPayout = (staffId, staffName, role, defaultAmount) => {
    if (!isFullyPaid) {
      showToast?.("Chỉ có thể quyết toán thù lao cho nhân viên khi khách hàng đã hoàn tất mọi thanh toán!", "warning");
      return;
    }

    let staffProfile = null;
    if (role === "SURVEYOR") {
      staffProfile = supervisors.find(
        (s) => Number(s.userId || s.id) === Number(staffId) || s.username === staffName
      );
    } else {
      staffProfile = workers.find(
        (w) => Number(w.userId || w.id) === Number(staffId) || w.username === staffName
      );
    }

    const bankName = staffProfile?.bankName || "MB Bank (Ngân hàng Quân Đội)";
    const bankAccountNumber = staffProfile?.bankAccountNumber || staffProfile?.phoneNumber || "0355880362";
    const bankAccountName = staffProfile?.bankAccountName || staffName || "NHAN VIEN";
    const bankCode = getVietQRBankCode(bankName);

    setPayoutModalData({
      orderId: order.id,
      staffId: staffId,
      staffName: staffName,
      role: role,
      amount: defaultAmount,
      bankName: bankName,
      bankCode: bankCode,
      bankAccountNumber: bankAccountNumber,
      bankAccountName: bankAccountName,
    });
  };

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

  if (loading) return <LoadingSpinner />;
  if (!order) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
        <p className="text-slate-500 font-semibold">Không tìm thấy yêu cầu này.</p>
        <button
          onClick={() => navigate("/admin/bookings")}
          className="mt-4 px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Nút Quay Lại Danh Sách Yêu Cầu */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate("/admin/bookings")}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-2xl text-xs border border-slate-200 shadow-xs transition hover:border-emerald-300 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-600" />
          <span>Quay lại danh sách yêu cầu</span>
        </button>
      </div>

      <DashboardHeader
        title={`Chi Tiết Yêu Cầu #${order.id}`}
        subtitle={`Quản lý toàn bộ tiến độ công trình, hợp đồng và phân công nhân sự.`}
        userName={user?.username}
        userRole="Quản trị viên"
        avatarChar={(user?.username || "A").charAt(0).toUpperCase()}
      />

      {/* Tiến độ trạng thái (OrderTimeline) */}
      <OrderTimeline status={status} />

      {/* Hero Admin Next-Action Guidance */}
      <OrderActionBanner
        role="admin"
        booking={order}
        contract={contract}
        canChangeSupervisor={canChangeSupervisor}
        dailyReportsCount={dailyReports.length}
        onAction={(actionType) => {
          if (actionType === "assign_supervisor") setAssignModal("supervisor");
          else if (actionType === "quote") setQuoteModalOpen(true);
          else if (actionType === "open_contract") setConfirmDepositModal(true);
          else if (actionType === "confirm_deposit") setConfirmDepositModal(true);
          else if (actionType === "assign_worker") setAssignModal("worker");
          else if (actionType === "view_reports") setReportsModalOpen(true);
          else if (actionType === "pay_staff") {
            const el = document.getElementById("staff-payout-section");
            if (el) {
              el.scrollIntoView({ behavior: "smooth" });
            } else if (order.supervisorId && !isSupervisorPaid) {
              handleOpenStaffPayout(order.supervisorId, order.supervisorName || "Giám sát", "SURVEYOR", supervisorFee);
            } else if (order.technicianId && !isWorkerPaid) {
              handleOpenStaffPayout(order.technicianId, order.technicianName || "Đội thợ", "TECHNICIAN", workerFee);
            }
          }
          else if (actionType === "export_pdf") {
            if (contract) {
              exportContractPDF(contract, order);
              showToast?.("Đã tải xuống file PDF hợp đồng thành công!", "success");
            } else {
              showToast?.("Chưa có hợp đồng để xuất file PDF!", "warning");
            }
          }
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Cột trái: Thông tin đơn hàng & Khách hàng */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-black text-slate-900 text-lg">Mã đơn: #{order.id}</span>
                <StatusBadge status={status} />
              </div>
              <div className="text-xs text-slate-400 font-medium">
                Ngày đăng ký: {order.createdAt ? new Date(order.createdAt).toLocaleDateString("vi-VN") : "—"}
              </div>
            </div>

            {/* Thông tin Khách hàng & Công trình */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                  <User className="w-4 h-4 text-emerald-600" />
                  <span>Thông tin khách hàng</span>
                </div>
                <div className="text-xs space-y-1">
                  <div className="font-bold text-slate-900">
                    {order.customerName || order.customer?.fullName || order.customer?.username || "Khách vảng lai"}
                  </div>
                  <div className="text-slate-500">SĐT: {order.customerPhone || order.customer?.phoneNumber || "Chưa cập nhật"}</div>
                  <div className="text-slate-500 truncate">Email: {order.customerEmail || order.customer?.email || "—"}</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>Địa chỉ công trình (HN)</span>
                </div>
                <div className="text-xs space-y-1">
                  <div className="font-bold text-slate-900 leading-snug">{order.address || "—"}</div>
                  {projectDistrict && (
                    <span className="inline-block text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Khu vực: {projectDistrict}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Mô tả hiện trạng ban đầu & Thương lượng từ khách */}
            {(() => {
              const negInfo = parseNegotiationInfo(order?.description);
              const displayDesc = negInfo.initialDesc || (!negInfo.hasNegotiation ? order?.description : "") || "Không có ghi chú mô tả ban đầu.";

              return (
                <div className="space-y-3">
                  {/* Ô mô tả ban đầu */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                      <FileText className="w-4 h-4 text-emerald-600" />
                      <span>Hạng mục &amp; Yêu cầu ban đầu từ khách</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {displayDesc}
                    </p>
                  </div>

                  {/* Khi khách đang yêu cầu thương lượng giá */}
                  {negInfo.hasNegotiation && (
                    <div className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-4 space-y-3 shadow-xs">
                      <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center shrink-0">
                            <AlertCircle className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white px-2 py-0.5 rounded-full">
                            ⚠️ Đang Yêu Cầu Thương Lượng Giá
                          </span>
                        </div>
                        {negInfo.proposedPrice && (
                          <span className="text-xs font-black text-emerald-900 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                            Đề xuất: {negInfo.proposedPrice}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="bg-white p-2.5 rounded-xl border border-amber-200">
                          <span className="text-[10px] text-slate-500 font-bold block uppercase">Báo giá gốc</span>
                          <span className="font-black text-slate-900 text-sm block mt-0.5">{order.totalAmount ? formatMoney(order.totalAmount) : "—"}</span>
                        </div>
                        <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                          <span className="text-[10px] text-emerald-800 font-bold block uppercase">Mức giá khách mong muốn</span>
                          <span className="font-black text-emerald-700 text-sm block mt-0.5">{negInfo.proposedPrice || "Không nêu mức giá cụ thể"}</span>
                        </div>
                      </div>

                      {negInfo.message && (
                        <div className="bg-white rounded-xl border border-amber-200 p-2.5 text-xs text-amber-900 italic font-medium">
                          💬 Lý do từ khách: "{negInfo.message}"
                        </div>
                      )}

                      <p className="text-[10px] text-amber-700 leading-relaxed">
                        → Hãy liên hệ khách hàng để thỏa thuận và cập nhật lại báo giá bằng nút "Cập Nhật Báo Giá" trong banner bên trên.
                      </p>
                    </div>
                  )}

                  {/* Lịch sử thương lượng cũ nếu có */}
                  {negInfo.history.filter((h) => !h.isCurrent).length > 0 && (
                    <div className="p-3 rounded-2xl bg-white border border-slate-200 space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-600 block uppercase">
                        📜 Lịch sử các lần thương lượng trước ({negInfo.history.filter((h) => !h.isCurrent).length} lần):
                      </span>
                      {negInfo.history.filter((h) => !h.isCurrent).map((item, idx) => (
                        <p key={idx} className="text-xs text-slate-600 font-medium">
                          • {item.rawText}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* BÁO CÁO KHẢO SÁT HIỆN TRẠNG TỪ GIÁM SÁT VIÊN */}
            {surveyDetail ? (
              <SurveyReportCard
                surveyDetail={surveyDetail}
                supervisorName={order.supervisorName || order.surveyorName}
                onPreviewImage={setPreviewImage}
              />
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-500 flex items-center gap-2">
                <span className="text-base">⏳</span>
                <span>
                  {order.supervisorId
                    ? "Giám sát viên đang tiến hành khảo sát hiện trạng, chưa nộp báo cáo."
                    : "Chưa phân công giám sát viên khảo sát công trình."}
                </span>
              </div>
            )}

            {/* Chi tiết tài chính & Hợp đồng */}
            <div className="p-5 rounded-2xl bg-emerald-50/40 border border-emerald-200/80 space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                  Tài chính công trình
                </span>
                <span className="text-xs font-bold text-emerald-800">
                  {isFullyPaid ? "✓ Tất toán 100%" : isDepositPaid ? "✓ Đã cọc 30%" : "Chờ cọc"}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Tổng dự toán</span>
                  <span className="font-black text-slate-900 text-sm">
                    {order.totalAmount ? formatMoney(order.totalAmount) : "Chưa báo giá"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Tiền cọc (30%)</span>
                  <span className="font-bold text-emerald-700 text-sm">
                    {order.depositAmount ? formatMoney(order.depositAmount) : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Còn lại (70%)</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {order.totalAmount && order.depositAmount
                      ? formatMoney(order.totalAmount - order.depositAmount)
                      : "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card Báo Cáo Tiến Độ & Vật Liệu Phát Sinh Hàng Ngày */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
                  Nhật Ký Thi Công &amp; Vật Tư Phát Sinh
                </h4>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {dailyReports.length} báo cáo nộp
              </span>
            </div>

            {/* Banner tổng hợp vật tư phát sinh & tiến độ */}
            {dailyReports.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-gradient-to-r from-amber-50/60 via-orange-50/40 to-slate-50 rounded-2xl border border-amber-200/80">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block">Số lượt báo cáo</span>
                  <span className="text-base font-black text-slate-900">{dailyReports.length} ngày</span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block">Tiến độ cập nhật mới nhất</span>
                  <span className="text-base font-black text-emerald-600">
                    {dailyReports[0]?.progressPercentage != null ? `${dailyReports[0].progressPercentage}%` : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block">Tổng tiền vật tư phát sinh</span>
                  <span className="text-base font-black text-amber-700">
                    {formatMoney(materialReimbursement)}
                  </span>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                    (Hoàn tiền cho Giám sát khi quyết toán)
                  </p>
                </div>
              </div>
            )}

            {loadingReports ? (
              <div className="py-6 text-center text-xs text-slate-400">
                Đang tải báo cáo nhật ký...
              </div>
            ) : dailyReports.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-500 flex items-center gap-2">
                <span className="text-base">📝</span>
                <span>
                  {["ASSIGNED", "PROCESSING"].includes(status)
                    ? "Đội thợ đang thi công, chưa có báo cáo nhật ký trong ngày được nộp."
                    : "Chưa có báo cáo nhật ký thi công nào cho đơn hàng này."}
                </span>
              </div>
            ) : (
              <div className="space-y-4">
                {dailyReports.map((report, index) => {
                  const reportImages = parseImageUrls(report.progressImages);
                  const itemCost = Number(report.materialCost) || 0;

                  return (
                    <div
                      key={report.id || index}
                      className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 hover:border-amber-300 transition space-y-3.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-xs text-slate-900 bg-slate-200 px-2.5 py-1 rounded-lg">
                            📅 Báo cáo ngày #{dailyReports.length - index}
                          </span>
                          <span className="text-xs text-slate-600 font-medium">
                            Lập bởi: <strong className="text-slate-900 font-bold">@{report.reporterName || "Giám sát / Thợ"}</strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          {report.progressPercentage != null && (
                            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                              Tiến độ: {report.progressPercentage}%
                            </span>
                          )}
                          {itemCost > 0 && (
                            <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                              💰 Phát sinh: +{formatMoney(itemCost)}
                            </span>
                          )}
                          {report.createdAt && (
                            <span className="text-[10.5px] text-slate-400 font-medium">
                              {new Date(report.createdAt).toLocaleString("vi-VN")}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Thanh Progress bar mini nếu có tiến độ */}
                      {report.progressPercentage != null && (
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, Math.max(0, report.progressPercentage))}%` }}
                          />
                        </div>
                      )}

                      {/* Nội dung báo cáo */}
                      <div className="text-xs text-slate-800 font-medium whitespace-pre-wrap leading-relaxed bg-white p-3.5 rounded-xl border border-slate-200/60 shadow-2xs">
                        <span className="text-[11px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
                          Nội dung công việc thực hiện:
                        </span>
                        {report.content}
                      </div>

                      {/* Khung Chi tiết Vật tư phát sinh & Tiền chi */}
                      {(report.materialShortage || itemCost > 0) && (
                        <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-xs space-y-2">
                          <div className="flex items-center justify-between border-b border-amber-200/60 pb-1.5">
                            <span className="font-bold text-amber-950 flex items-center gap-1.5">
                              <span>⚠️</span> Chi tiết vật tư phát sinh trong ngày:
                            </span>
                            {itemCost > 0 && (
                              <span className="font-bold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-md text-[11px]">
                                Chi phí: <strong>{formatMoney(itemCost)}</strong>
                              </span>
                            )}
                          </div>
                          {report.materialShortage && (
                            <p className="text-amber-900 font-medium whitespace-pre-wrap leading-relaxed">
                              {report.materialShortage}
                            </p>
                          )}
                          <p className="text-[10.5px] text-amber-700 italic">
                            * Khoản tiền vật tư phát sinh này được cộng vào tổng quyết toán chi trả cho Giám sát viên.
                          </p>
                        </div>
                      )}

                      {/* Hình ảnh tiến độ */}
                      {reportImages.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                            <span>📸</span> Ảnh chụp hiện trường ({reportImages.length} ảnh):
                          </span>
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                            {reportImages.map((imgUrl, imgIdx) => (
                              <div
                                key={imgIdx}
                                onClick={() => setPreviewImage(imgUrl)}
                                className="aspect-square rounded-xl overflow-hidden border border-slate-200 bg-white hover:opacity-90 hover:scale-105 transition cursor-pointer shadow-xs group relative"
                              >
                                <img
                                  src={imgUrl}
                                  alt={`Tiến độ ${imgIdx + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "https://placehold.co/150x150?text=Anh+TD";
                                  }}
                                />
                                <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-bold">
                                  🔍 Xem
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Cột phải: Bảng điều phối nhân sự & Hành động nhanh */}
        <div className="space-y-6">
          {/* Card Phân công Giám sát & Thợ sơn */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
            <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Điều Phối Nhân Sự</span>
            </h4>

            {/* Giám sát viên */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="text-xs font-bold text-slate-700">
                Giám sát khảo sát:
              </div>
              <div className="font-bold text-sm text-slate-900">
                {order.supervisorName || order.supervisor?.fullName || order.supervisor?.username ? (
                  `@${order.supervisorName || order.supervisor?.username}`
                ) : (
                  <span className="text-amber-700 text-xs font-semibold">Chưa phân công</span>
                )}
              </div>
              {canChangeSupervisor ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(order.supervisorId ? String(order.supervisorId) : "");
                    setSupervisorModalTab("all");
                    setAssignModal("supervisor");
                  }}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-xs"
                >
                  {order.supervisorId ? "Đổi Giám Sát Phụ Trách" : "+ Gán Giám Sát Viên"}
                </button>
              ) : (
                <div className="p-2 bg-emerald-50 text-emerald-800 text-[11px] font-bold rounded-xl border border-emerald-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Giám sát đã nộp báo cáo (Khóa đổi)</span>
                </div>
              )}
            </div>

            {/* Đội thợ sơn */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="text-xs font-bold text-slate-700">
                Đội thợ thi công:
              </div>
              <div className="font-bold text-sm text-slate-900">
                {order.technicianName || order.technician?.fullName || order.technician?.username ? (
                  `@${order.technicianName || order.technician?.username}`
                ) : (
                  <span className="text-amber-700 text-xs font-semibold">Chưa bàn giao thợ</span>
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
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-xs"
                >
                  {order.technicianId ? "Đổi Đội Thợ Thi Công" : "+ Gán Đội Thợ Sơn"}
                </button>
              ) : isWorkStartedOrCompleted ? (
                <div className="p-2 bg-emerald-50 text-emerald-800 text-[11px] font-bold rounded-xl border border-emerald-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    {status === "PROCESSING"
                      ? "Đội thợ đang thi công (Khóa đổi thợ)"
                      : "Công trình đã hoàn thành (Khóa đổi thợ)"}
                  </span>
                </div>
              ) : (
                <div className="space-y-1.5 pt-1">
                  <button
                    type="button"
                    disabled
                    className="w-full py-2 bg-slate-200 text-slate-400 font-bold rounded-xl text-xs cursor-not-allowed"
                  >
                    + Gán Đội Thợ Sơn (Khóa)
                  </button>
                  {!contract?.customerSigned ? (
                    <p className="text-[10.5px] text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200 font-medium leading-snug">
                      🔒 Chờ khách hàng chọn ngày và ký hợp đồng điện tử.
                    </p>
                  ) : !contract?.adminSigned ? (
                    <p className="text-[10.5px] text-rose-800 bg-rose-50 p-2 rounded-xl border border-rose-200 font-bold leading-snug">
                      ⚠️ Admin chưa ký hợp đồng! Vui lòng bấm nút <strong>"Xác Nhận Nộp Cọc &amp; Ký HĐ"</strong> bên dưới để ký hợp đồng trước khi phân thợ.
                    </p>
                  ) : (
                    <p className="text-[10.5px] text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200 font-medium leading-snug">
                      🔒 Chờ xác nhận tiền cọc để phân công thợ thi công.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Card Quyết toán Thù Lao Nhân Sự (Chỉ hiển thị khi khách hàng đã hoàn tất mọi thanh toán) */}
          {isFullyPaid && (order.supervisorId || order.technicianId) && (
            <div id="staff-payout-section" className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>Quyết Toán Thù Lao Nhân Sự</span>
                </h4>
                {status === "PAID_TO_STAFF" ? (
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    ✓ Đã quyết toán 100%
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                    Chờ quyết toán
                  </span>
                )}
              </div>

              <div className="space-y-3 text-xs">
                {/* Admin giữ lại */}
                <div className="p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10.5px] font-bold text-emerald-800 uppercase tracking-wider">Doanh thu Admin giữ lại (30%):</span>
                    <p className="text-[11px] text-emerald-600 font-medium">Bao gồm lợi nhuận sàn &amp; quỹ dự phòng bảo hành 1-2 năm</p>
                  </div>
                  <span className="font-black text-emerald-700 text-sm">{formatMoney(adminFee)}</span>
                </div>

                {/* Giám sát viên */}
                {order.supervisorId && (
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {order.supervisorAvatar || order.surveyorAvatar ? (
                        <img
                          src={order.supervisorAvatar || order.surveyorAvatar}
                          alt="Supervisor"
                          className="w-10 h-10 rounded-xl object-cover border border-blue-200 shrink-0 shadow-2xs"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 font-black text-sm flex items-center justify-center shrink-0 border border-blue-200">
                          {(order.supervisorName || order.supervisor?.username || "S").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="space-y-0.5">
                        <div className="text-[10.5px] font-bold text-blue-700 uppercase">
                          Giám sát (10% + Hoàn tiền vật tư): @{order.supervisorName || order.supervisor?.username || "Giám sát"}
                        </div>
                        <div className="text-slate-800 font-bold text-sm flex items-center gap-2">
                          <span>Thù lao: <strong className="text-blue-700">{formatMoney(supervisorFee)}</strong></span>
                          {materialReimbursement > 0 && (
                            <span className="text-[10.5px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              (10%: {formatMoney(supervisorBaseFee)} + VT: {formatMoney(materialReimbursement)})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      {isSupervisorPaid ? (
                        <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 font-bold rounded-xl text-xs flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>Đã thanh toán</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenStaffPayout(order.supervisorId, order.supervisorName || "Giám sát", "SURVEYOR", supervisorFee)}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-xs flex items-center gap-1.5"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Thanh toán VietQR</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Đội thợ thi công */}
                {order.technicianId && (
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {order.technicianAvatar ? (
                        <img
                          src={order.technicianAvatar}
                          alt="Technician"
                          className="w-10 h-10 rounded-xl object-cover border border-emerald-200 shrink-0 shadow-2xs"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center shrink-0 border border-emerald-200">
                          {(order.technicianName || order.technician?.username || "T").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="space-y-0.5">
                        <div className="text-[10.5px] font-bold text-emerald-700 uppercase">
                          Đội thợ (60%): @{order.technicianName || order.technician?.username || "Đội thợ"}
                        </div>
                        <div className="text-slate-800 font-bold text-sm">
                          Thù lao thi công: <span className="text-emerald-700">{formatMoney(workerFee)}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      {isWorkerPaid ? (
                        <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 font-bold rounded-xl text-xs flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>Đã thanh toán</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenStaffPayout(order.technicianId, order.technicianName || "Đội thợ", "TECHNICIAN", workerFee)}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-xs flex items-center gap-1.5"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Thanh toán VietQR</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Các hành động xử lý bước tiếp theo */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider border-b border-slate-100 pb-3">
              Xử Lý Bước Tiếp Theo
            </h4>

            {status === "WAITING_ADMIN_QUOTE" && (
              <button
                type="button"
                onClick={() => setQuoteModalOpen(true)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-xs flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4 text-white" />
                <span>Gửi Báo Giá Cho Khách</span>
              </button>
            )}

            {(status === "WAITING_DEPOSIT" || (contract?.customerSigned && !contract?.adminSigned)) && (
              <div className="space-y-2">
                {isDepositPaid && !contract?.adminSigned && (
                  <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-2xl text-[11px] leading-snug">
                    <span className="font-bold flex items-center gap-1.5 text-emerald-800 mb-1">
                      <span>🎉</span> Khách hàng đã chuyển cọc 30%!
                    </span>
                    Admin vui lòng ký duyệt hợp đồng điện tử để hoàn tất thủ tục và kích hoạt quyền phân công thợ thi công.
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setConfirmDepositModal(true)}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-xs flex items-center justify-center gap-2 animate-pulse"
                >
                  <PenTool className="w-4 h-4 text-white" />
                  <span>
                    {isDepositPaid ? "✍️ Ký Duyệt Hợp Đồng Cọc" : "Xác Nhận Nộp Cọc & Ký HĐ"}
                  </span>
                </button>
              </div>
            )}

            {contract ? (
              <button
                type="button"
                onClick={() => setContractModalOpen(true)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2 border border-slate-200"
              >
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Xem Hợp Đồng Điện Tử</span>
              </button>
            ) : (
              <div className="text-[11px] text-slate-400 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center font-medium">
                📄 Hợp đồng sẽ tự động sinh sau khi Admin gửi báo giá.
              </div>
            )}

            {dailyReports.length > 0 && (
              <button
                type="button"
                onClick={() => setReportsModalOpen(true)}
                className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl text-xs transition cursor-pointer border border-emerald-200 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Báo Cáo Nhật Ký ({dailyReports.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal Phân Công Nhân Sự (Ưu tiên theo Khu vực & Tải công việc) */}
      <Modal
        isOpen={!!assignModal}
        onClose={() => setAssignModal(null)}
        title={
          assignModal === "supervisor"
            ? "Phân công Giám sát khảo sát"
            : "Phân công Đội thợ thi công"
        }
        size="lg"
      >
        <div className="space-y-4">
          {assignModal === "supervisor" ? (
            <div className="space-y-3">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-950 leading-relaxed">
                <span className="font-bold block">💡 Hướng dẫn phân công Giám Sát:</span>
                • Hệ thống hiển thị các Giám sát viên đang <strong>BẬT trạng thái hoạt động</strong>.
                <br />
                • Ưu tiên chọn giám sát cùng khu vực <strong>{projectDistrict || "Hà Nội"}</strong> hoặc đang rảnh để khảo sát nhanh nhất.
              </div>

              {/* 3 Mục lọc Giám sát */}
              <div className="flex border-b border-slate-200 gap-1 pb-2">
                <button
                  type="button"
                  onClick={() => setSupervisorModalTab("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${supervisorModalTab === "all"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                >
                  Tất cả ({eligibleSupervisors.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSupervisorModalTab("district")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${supervisorModalTab === "district"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                >
                  ★ Cùng khu vực ({districtSupervisors.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSupervisorModalTab("idle")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${supervisorModalTab === "idle"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                >
                  ⚡ Đang rảnh ({idleSupervisors.length})
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-950 leading-relaxed">
                <span className="font-bold block">💡 Hướng dẫn phân công Đội Thợ:</span>
                • Dịch vụ yêu cầu: <strong className="text-emerald-800">{orderServiceName || "Tất cả"}</strong>.
                <br />
                • Hệ thống <strong>chỉ hiển thị thợ cùng chuyên môn dịch vụ</strong> và đang <strong>BẬT trạng thái hoạt động</strong>.
              </div>

              {/* 3 Mục lọc thợ */}
              <div className="flex border-b border-slate-200 gap-1 pb-2">
                <button
                  type="button"
                  onClick={() => setWorkerModalTab("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${workerModalTab === "all"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                >
                  Tất cả ({eligibleWorkers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setWorkerModalTab("district")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${workerModalTab === "district"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                >
                  ★ Cùng khu vực ({districtWorkers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setWorkerModalTab("idle")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${workerModalTab === "idle"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                >
                  ⚡ Đang rảnh ({idleWorkers.length})
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
            {((assignModal === "supervisor" ? displaySupervisors : displayWorkers).length === 0) ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                Không tìm thấy nhân viên phù hợp với tiêu chí này
              </p>
            ) : (
              (assignModal === "supervisor" ? displaySupervisors : displayWorkers).map((s) => {
                const sId = String(s.userId || s.id);
                const isSelected = selectedId === sId;

                const isDistrictMatch =
                  projectDistrict &&
                  s.serviceArea?.toLowerCase().includes(projectDistrict.replace("Quận ", "").replace("Huyện ", "").toLowerCase());

                const currentLoad =
                  assignModal === "supervisor"
                    ? (activeSupervisorJobs[sId] || 0)
                    : (activeWorkerJobs[sId] || 0);

                return (
                  <div
                    key={sId}
                    onClick={() => setSelectedId(sId)}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${isSelected
                      ? "border-emerald-600 bg-emerald-50/60 shadow-xs"
                      : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50"
                      }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {s.avatar ? (
                        <img
                          src={s.avatar}
                          alt={s.username}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0 shadow-2xs"
                        />
                      ) : (
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${assignModal === "supervisor"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-emerald-100 text-emerald-800"
                            }`}
                        >
                          {(s.username || "S").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs truncate">
                            @{s.username} {s.fullName ? `(${s.fullName})` : ""}
                          </span>

                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                            Đang hoạt động
                          </span>

                          {isDistrictMatch && (
                            <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full shrink-0">
                              ★ Cùng khu vực
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span>Chuyên môn: <strong className="text-slate-700">{s.specialty || "Sơn nhà"}</strong></span>
                          <span>
                            Khu vực: <strong className="text-slate-700">{s.serviceArea || "Toàn Hà Nội"}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-xl block ${currentLoad === 0
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-700"
                          }`}
                      >
                        {currentLoad === 0 ? "⚡ Đang rảnh (0 đơn)" : `Đang làm: ${currentLoad} đơn`}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setAssignModal(null)}
              className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-200 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleAssign}
              disabled={!selectedId}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-xs"
            >
              Xác Nhận Phân Công
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Gửi / Cập Nhật Báo Giá */}
      <Modal
        isOpen={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
        title={order?.status === "WAITING_CUSTOMER_SIGNATURE" ? "Điều chỉnh báo giá & Dự toán thi công" : "Lập báo giá & Dự toán thi công"}
      >
        <div className="space-y-4">
          {(() => {
            const negInfo = parseNegotiationInfo(order?.description);
            const proposedRawNumber = negInfo.proposedPrice ? negInfo.proposedPrice.replace(/[^\d]/g, "") : null;

            if (!negInfo.hasNegotiation) return null;

            return (
              <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-300 rounded-2xl text-xs space-y-3 shadow-2xs">
                <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
                  <span className="font-black text-amber-950 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    Đề xuất điều chỉnh từ Khách hàng
                  </span>
                  {negInfo.proposedPrice && (
                    <span className="font-black text-emerald-900 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full text-xs">
                      {negInfo.proposedPrice}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white/90 p-2.5 rounded-xl border border-amber-200">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Báo giá hiện tại</span>
                    <span className="font-black text-slate-900 text-sm block mt-0.5">
                      {order.totalAmount ? formatMoney(order.totalAmount) : "—"}
                    </span>
                  </div>
                  <div className="bg-emerald-50/90 p-2.5 rounded-xl border border-emerald-300">
                    <span className="text-[10px] text-emerald-800 font-bold block uppercase">Mức giá đề xuất</span>
                    <span className="font-black text-emerald-700 text-sm block mt-0.5">
                      {negInfo.proposedPrice || "Chưa ghi số tiền"}
                    </span>
                  </div>
                </div>

                {negInfo.message && (
                  <div className="text-slate-800 text-xs bg-white/90 p-2.5 rounded-xl border border-amber-200 font-medium leading-relaxed">
                    <span className="text-[10px] text-slate-400 font-bold block mb-0.5">Ghi chú từ khách hàng:</span>
                    "{negInfo.message}"
                  </div>
                )}

                {proposedRawNumber && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuoteTotal(proposedRawNumber);
                      setQuoteDeposit(String(Math.round(Number(proposedRawNumber) * 0.3)));
                      showToast?.(`Đã áp dụng mức dự toán đề xuất: ${Number(proposedRawNumber).toLocaleString("vi-VN")}đ`, "success");
                    }}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5 hover:shadow-md active:scale-98"
                  >
                    <span>✨</span>
                    <span>Áp dụng mức giá đề xuất ({negInfo.proposedPrice})</span>
                  </button>
                )}
              </div>
            );
          })()}

          <p className="text-xs text-slate-600 leading-relaxed">
            Dựa trên khảo sát thực tế và thỏa thuận với khách hàng, Admin cập nhật lại tổng dự toán, số ngày thi công và thời hạn bảo hành. Hợp đồng điện tử sẽ tự động đồng bộ theo mức giá mới.
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tổng giá trị dự toán (VNĐ) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                value={quoteTotal}
                onChange={(e) => {
                  const val = e.target.value;
                  setQuoteTotal(val);
                  if (val && !isNaN(val)) {
                    setQuoteDeposit(String(Math.round(Number(val) * 0.3)));
                  } else {
                    setQuoteDeposit("");
                  }
                }}
                placeholder="Ví dụ: 15000000"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tiền cọc yêu cầu (30%)
              </label>
              <input
                type="number"
                value={quoteDeposit}
                readOnly
                className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-emerald-700 font-bold outline-none cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Số ngày làm việc dự kiến <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={quoteEstimatedDays}
                  onChange={(e) => setQuoteEstimatedDays(e.target.value)}
                  placeholder="3"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Thời hạn bảo hành (năm) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={quoteWarrantyYears}
                  onChange={(e) => setQuoteWarrantyYears(e.target.value)}
                  placeholder="2"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none font-bold"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setQuoteModalOpen(false)}
              className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-200 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSendQuote}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-xs"
            >
              Gửi Báo Giá &amp; Sinh Hợp Đồng
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Xác nhận cọc và Admin Ký */}
      <Modal
        isOpen={confirmDepositModal}
        onClose={() => setConfirmDepositModal(false)}
        title="Ký duyệt hợp đồng &amp; Xác nhận cọc"
      >
        <div className="space-y-4">
          {isDepositPaid ? (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 leading-relaxed font-medium">
              <span className="font-bold block text-emerald-900 mb-0.5">✓ Khách hàng đã chuyển cọc 30% thành công qua VNPay Sandbox!</span>
              Số tiền cọc: <strong className="text-emerald-700">{order.depositAmount ? formatMoney(order.depositAmount) : "—"}</strong>.
              <br />
              Admin tiến hành ký chữ ký điện tử đại diện Công ty vào khung bên dưới để hợp đồng có đầy đủ pháp lý và kích hoạt quyền phân công thợ.
            </div>
          ) : (
            <p className="text-xs text-slate-600 leading-relaxed">
              Khách hàng thực hiện nộp cọc 30% trực tuyến qua cổng VNPay Sandbox. Sau khi xác nhận tiền cọc, Admin tiến hành ký chữ ký điện tử đóng dấu hợp đồng.
            </p>
          )}

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold text-slate-700">
                Chữ ký Admin (Đại diện công ty) <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={clearAdminSignature}
                className="text-xs text-rose-600 hover:underline font-bold cursor-pointer"
              >
                Xóa chữ ký
              </button>
            </div>
            <div className="border-2 border-dashed border-slate-300 rounded-2xl bg-white overflow-hidden touch-none">
              <canvas
                ref={adminSigCanvasRef}
                width={500}
                height={150}
                className="w-full cursor-crosshair block bg-slate-50"
                style={{ touchAction: "none" }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              {hasAdminSignature ? (
                <span className="text-emerald-700 font-bold">✓ Đã ký tên xác nhận</span>
              ) : (
                <span className="text-amber-700 font-semibold">⚠️ Vui lòng ký tên vào khung trước khi xác nhận</span>
              )}
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setConfirmDepositModal(false)}
              className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-200 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirmDeposit}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-xs"
            >
              Ký Hợp Đồng &amp; Xác Nhận Cọc
            </button>
          </div>
        </div>
      </Modal>

      {/* Shared Contract Modal */}
      <ContractModal
        isOpen={contractModalOpen}
        onClose={() => setContractModalOpen(false)}
        contract={contract}
        booking={order}
        role="admin"
        showToast={showToast}
        onSuccess={() => {
          fetchOrder();
          fetchContract(id);
        }}
      />

      {/* Modal Xem Danh Sách Báo Cáo Nhật Ký */}
      <Modal
        isOpen={reportsModalOpen}
        onClose={() => setReportsModalOpen(false)}
        title={`Nhật Ký & Báo Cáo Tiến Độ Thi Công (${dailyReports.length})`}
        size="lg"
      >
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {dailyReports.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center font-medium">
              Chưa có báo cáo nhật ký thi công nào.
            </p>
          ) : (
            dailyReports.map((report, index) => {
              const reportImages = parseImageUrls(report.progressImages);
              return (
                <div
                  key={report.id || index}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 bg-slate-200 px-2 py-0.5 rounded-md">
                        📅 Báo cáo ngày #{dailyReports.length - index}
                      </span>
                      <span className="text-slate-600 font-medium">
                        Lập bởi: <strong className="text-slate-900">@{report.reporterName || "Thợ thi công"}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {report.progressPercentage != null && (
                        <span className="font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          {report.progressPercentage}% hoàn thành
                        </span>
                      )}
                      {report.createdAt && (
                        <span className="text-[11px] text-slate-400">
                          {new Date(report.createdAt).toLocaleString("vi-VN")}
                        </span>
                      )}
                    </div>
                  </div>

                  {report.progressPercentage != null && (
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(0, report.progressPercentage))}%` }}
                      />
                    </div>
                  )}

                  <div className="text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                    {report.content}
                  </div>

                  {report.materialShortage && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-medium">
                      <span className="font-bold block mb-1">⚠️ Vật tư phát sinh / thiếu hụt:</span>
                      {report.materialShortage}
                    </div>
                  )}

                  {reportImages.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="font-bold text-slate-700 block">
                        📸 Hình ảnh thi công thực tế ({reportImages.length} ảnh):
                      </span>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                        {reportImages.map((imgUrl, imgIdx) => (
                          <div
                            key={imgIdx}
                            onClick={() => setPreviewImage(imgUrl)}
                            className="aspect-square rounded-xl overflow-hidden border border-slate-200 bg-white hover:opacity-90 hover:scale-105 transition cursor-pointer shadow-xs relative group"
                          >
                            <img
                              src={imgUrl}
                              alt={`Tiến độ ${imgIdx + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://placehold.co/150x150?text=Anh+TD";
                              }}
                            />
                            <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-bold">
                              🔍 Xem
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}

          <div className="pt-2 border-t border-slate-200 flex justify-end">
            <button
              type="button"
              onClick={() => setReportsModalOpen(false)}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Thanh toán thù lao cho Nhân viên qua VietQR */}
      <Modal
        isOpen={Boolean(payoutModalData)}
        onClose={() => setPayoutModalData(null)}
        title="Thanh Toán Thù Lao Nhân Sự (VietQR)"
        size="md"
      >
        {payoutModalData && (
          <div className="space-y-4">
            <div className="p-3.5 bg-emerald-50 text-emerald-950 border border-emerald-200 rounded-2xl text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-600">Nhân sự nhận thù lao:</span>
                <span className="font-bold text-slate-900">
                  {payoutModalData.staffName} (
                  {payoutModalData.role === "SURVEYOR" ? "Giám sát viên" : "Đội thợ thi công"})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Ngân hàng của nhân viên:</span>
                <span className="font-bold text-slate-900">{payoutModalData.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Số tài khoản:</span>
                <span className="font-bold font-mono text-slate-900">{payoutModalData.bankAccountNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Chủ tài khoản:</span>
                <span className="font-bold uppercase text-slate-900">{payoutModalData.bankAccountName}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-emerald-200/80">
                <span className="text-slate-600">Số tiền quyết toán:</span>
                <span className="text-emerald-700 font-black text-sm">{formatMoney(payoutModalData.amount)}</span>
              </div>
            </div>

            <QRCodePayment
              amount={payoutModalData.amount}
              orderId={payoutModalData.orderId}
              bankId={payoutModalData.bankCode}
              bankName={payoutModalData.bankName}
              accountNo={payoutModalData.bankAccountNumber}
              accountName={payoutModalData.bankAccountName}
              addInfo={`THU LAO DH${payoutModalData.orderId} ${payoutModalData.role === "SURVEYOR" ? "GS" : "THO"}`}
              title={`Quét mã VietQR trả thù lao cho ${payoutModalData.staffName}`}
              subTitle="Admin dùng App Ngân hàng quét mã để thanh toán thù lao trực tiếp về tài khoản nhân viên"
              confirmText={submittingPayout ? "Đang xác nhận..." : `Xác Nhận Đã Chuyển ${formatMoney(payoutModalData.amount)}`}
              onConfirm={handleConfirmStaffPayout}
              onClose={() => setPayoutModalData(null)}
              loading={submittingPayout}
            />
          </div>
        )}
      </Modal>

      {/* Shared Image Lightbox */}
      <ImageLightboxModal imageUrl={previewImage} onClose={() => setPreviewImage(null)} />
    </div>
  );
}