import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import AxiosConfig from "../../../util/AxiosConfig";
import DashboardHeader from "../../../components/layout/DashboardHeader";
import StatusBadge from "../../../components/common/StatusBadge";
import LoadingSpinner from "../../../components/common/LoadingSpinner";
import Modal from "../../../components/common/Modal";
import OrderTimeline from "./OrderTimeline";
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
} from "lucide-react";
import { exportContractPDF } from "../../../util/contractPdfExport";

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
  }, [id, fetchBookingDetail, fetchContract, fetchDailyReports, fetchPayments, showToast]);

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
  const isFullyPaid = order?.paymentStatus === "FULLY_PAID";
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

            {/* Mô tả hiện trạng ban đầu */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Hạng mục &amp; Yêu cầu ban đầu từ khách</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {order.description || "Không có ghi chú mô tả"}
              </p>
            </div>

            {/* BÁO CÁO KHẢO SÁT HIỆN TRẠNG TỪ GIÁM SÁT VIÊN */}
            {surveyDetail ? (
              <div className="p-5 rounded-3xl bg-blue-50/40 border border-blue-200/80 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-200/60 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center text-sm font-bold shadow-xs">
                      📋
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-sm">
                        Báo Cáo Khảo Sát Hiện Trạng
                      </h4>
                      <span className="text-[11px] text-blue-800 font-semibold">
                        Lập bởi Giám sát: @{order.supervisorName || order.surveyorName || "Giám sát viên"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {surveyDetail.updatedAt && (
                      <span className="text-[10px] text-slate-500 font-medium">
                        {new Date(surveyDetail.updatedAt).toLocaleString("vi-VN")}
                      </span>
                    )}
                    {surveyDetail.supervisorAccepted && (
                      <span className="text-[10.5px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        ✓ Đã duyệt hiện trạng
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Ghi chú khảo sát */}
                  <div className="p-3.5 rounded-2xl bg-white border border-blue-100 space-y-1.5 shadow-xs">
                    <span className="font-bold text-slate-900 block flex items-center gap-1.5 text-blue-900">
                      <span>🔍</span> Hiện trạng tường &amp; bề mặt:
                    </span>
                    <p className="text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">
                      {surveyDetail.surveyNote || "Chưa có ghi chú chi tiết."}
                    </p>
                  </div>

                  {/* Đề xuất vật tư */}
                  <div className="p-3.5 rounded-2xl bg-white border border-blue-100 space-y-1.5 shadow-xs">
                    <span className="font-bold text-slate-900 block flex items-center gap-1.5 text-blue-900">
                      <span>🧱</span> Đề xuất vật tư &amp; kỹ thuật:
                    </span>
                    <p className="text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">
                      {surveyDetail.materialNote || "Không có đề xuất vật tư."}
                    </p>
                  </div>
                </div>

                {/* Vật tư phát sinh / thiếu hụt nếu có */}
                {surveyDetail.materialShortage && (
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs space-y-1">
                    <span className="font-bold text-amber-900 block flex items-center gap-1.5">
                      <span>⚠️</span> Báo cáo thiếu hụt / phát sinh vật tư:
                    </span>
                    <p className="text-amber-800 leading-relaxed font-medium whitespace-pre-wrap">
                      {surveyDetail.materialShortage}
                    </p>
                  </div>
                )}

                {/* Album hình ảnh khảo sát hiện trạng */}
                {surveyImages.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span>📸</span> Hình ảnh chụp hiện trạng ({surveyImages.length} ảnh):
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                      {surveyImages.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          onClick={() => setPreviewImage(imgUrl)}
                          className="aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-white hover:opacity-90 hover:scale-105 transition cursor-pointer shadow-xs group relative"
                        >
                          <img
                            src={imgUrl}
                            alt={`Ảnh khảo sát ${idx + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "https://placehold.co/150x150?text=Anh+KS";
                            }}
                          />
                          <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[11px] font-bold">
                            🔍 Xem
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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

          {/* Card Báo Cáo Tiến Độ Hàng Ngày */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
                  Nhật Ký &amp; Báo Cáo Thi Công Hàng Ngày
                </h4>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {dailyReports.length} báo cáo
              </span>
            </div>

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
                  return (
                    <div
                      key={report.id || index}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 bg-slate-200/80 px-2 py-0.5 rounded-md">
                            📅 Báo cáo ngày #{dailyReports.length - index}
                          </span>
                          <span className="text-xs text-slate-600 font-medium">
                            Lập bởi: <strong className="text-slate-900">@{report.reporterName || "Thợ thi công"}</strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {report.progressPercentage != null && (
                            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                              Tiến độ: {report.progressPercentage}%
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
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, Math.max(0, report.progressPercentage))}%` }}
                          />
                        </div>
                      )}

                      {/* Nội dung báo cáo */}
                      <div className="text-xs text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">
                        {report.content}
                      </div>

                      {/* Vật tư phát sinh / thiếu nếu có */}
                      {report.materialShortage && (
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-1">
                          <span className="font-bold text-amber-900 flex items-center gap-1.5">
                            <span>⚠️</span> Vật tư phát sinh / thiếu hụt:
                          </span>
                          <p className="text-amber-800 font-medium whitespace-pre-wrap">
                            {report.materialShortage}
                          </p>
                        </div>
                      )}

                      {/* Hình ảnh tiến độ */}
                      {reportImages.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                            <span>📸</span> Ảnh tiến độ ({reportImages.length} ảnh):
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
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    supervisorModalTab === "all"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Tất cả ({eligibleSupervisors.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSupervisorModalTab("district")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    supervisorModalTab === "district"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  ★ Cùng khu vực ({districtSupervisors.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSupervisorModalTab("idle")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    supervisorModalTab === "idle"
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
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    workerModalTab === "all"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Tất cả ({eligibleWorkers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setWorkerModalTab("district")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    workerModalTab === "district"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  ★ Cùng khu vực ({districtWorkers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setWorkerModalTab("idle")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    workerModalTab === "idle"
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
                    <div className="space-y-1 min-w-0">
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

      {/* Modal Gửi Báo Giá */}
      <Modal
        isOpen={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
        title="Gửi báo giá &amp; Thời gian thi công cho khách"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Dựa trên báo cáo khảo sát từ Giám sát viên, Admin nhập tổng giá trị dự toán, số ngày thi công và thời hạn bảo hành. Khi gửi, hệ thống sẽ tự động tạo Hợp đồng điện tử để khách duyệt &amp; ký.
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

      {/* Modal Xem Hợp Đồng Điện Tử */}
      <Modal
        isOpen={contractModalOpen}
        onClose={() => setContractModalOpen(false)}
        title="Hợp Đồng Dịch Vụ Thi Công Sơn Nhà"
      >
        <div className="space-y-5 text-xs text-slate-700 max-h-[75vh] overflow-y-auto pr-1">
          {/* Header Hợp Đồng */}
          <div className="text-center pb-3 border-b border-slate-200 space-y-1">
            <h3 className="text-base font-black text-slate-900 uppercase">
              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
            </h3>
            <p className="text-[11px] font-bold text-slate-600">Độc lập - Tự do - Hạnh phúc</p>
            <div className="pt-2">
              <h4 className="text-sm font-black text-emerald-800 uppercase">
                HỢP ĐỒNG DỊCH VỤ THI CÔNG SƠN SỬA CÔNG TRÌNH
              </h4>
              <p className="text-[11px] text-slate-500 font-medium">
                Mã HĐ: <strong className="text-slate-900">{contract?.contractCode || `HD-${id}`}</strong> | Ngày lập:{" "}
                {contract?.createdAt
                  ? new Date(contract.createdAt).toLocaleDateString("vi-VN")
                  : new Date().toLocaleDateString("vi-VN")}
              </p>
            </div>
          </div>

          {/* Thông tin 2 bên */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
            <div className="space-y-1">
              <span className="font-bold text-slate-900 block border-b border-slate-200 pb-1">
                BÊN A (CHỦ NHÀ / KHÁCH HÀNG):
              </span>
              <p>Họ tên: <strong>{order?.customerName || order?.customer?.fullName || order?.customer?.username || "—"}</strong></p>
              <p>SĐT: <strong>{order?.customerPhone || order?.customer?.phoneNumber || "—"}</strong></p>
              <p>Địa chỉ công trình: <strong>{order?.address || "—"}</strong></p>
            </div>

            <div className="space-y-1">
              <span className="font-bold text-slate-900 block border-b border-slate-200 pb-1">
                BÊN B (ĐƠN VỊ THI CÔNG):
              </span>
              <p>Đơn vị: <strong>CÔNG TY DỊCH VỤ SƠN NHÀ 247</strong></p>
              <p>Hotline: <strong>1900 6868</strong></p>
              <p>Địa chỉ: <strong>Hà Nội, Việt Nam</strong></p>
            </div>
          </div>

          {/* Điều khoản & Cam kết */}
          <div className="space-y-2 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
            <span className="font-bold text-emerald-950 block">HẠNG MỤC THI CÔNG &amp; CAM KẾT:</span>
            <ul className="list-disc list-inside space-y-1 text-slate-700">
              <li>Dịch vụ: <strong>{order?.serviceName || order?.service?.name || "Sơn sửa nhà"}</strong></li>
              <li>Tổng giá trị hợp đồng: <strong className="text-emerald-700 text-sm">{formatMoney(order?.totalAmount || contract?.totalAmount || 0)}</strong></li>
              <li>Tiền đặt cọc cam kết (30%): <strong className="text-slate-900">{formatMoney(order?.depositAmount || (order?.totalAmount ? Number(order.totalAmount) * 0.3 : 0))}</strong></li>
              <li>Ngày bắt đầu thi công mong muốn: <strong>{order?.expectedStartDate || "Theo thỏa thuận 2 bên"}</strong></li>
              <li>Thời gian thi công dự kiến: <strong>{order?.estimatedDays || 3} ngày</strong></li>
              <li>Thời hạn bảo hành chất lượng: <strong>{order?.warrantyYears || 2} năm</strong></li>
            </ul>
          </div>

          {/* Trạng thái ký hợp đồng 2 bên */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            {/* Chữ ký Bên A */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 text-center space-y-2">
              <span className="text-[11px] font-bold text-slate-600 uppercase block">Đại diện Bên A (Khách hàng)</span>
              {contract?.customerSignatureImg ? (
                <div className="space-y-1">
                  <img
                    src={contract.customerSignatureImg}
                    alt="Chữ ký khách hàng"
                    className="h-16 max-w-full mx-auto object-contain bg-slate-50 rounded-lg p-1 border border-slate-100"
                  />
                  <span className="text-[10.5px] text-emerald-700 font-bold block">✓ Đã ký điện tử</span>
                  {contract.customerSignedAt && (
                    <span className="text-[10px] text-slate-400 block">
                      {new Date(contract.customerSignedAt).toLocaleString("vi-VN")}
                    </span>
                  )}
                </div>
              ) : contract?.customerSigned ? (
                <div className="py-4">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-full text-xs">
                    ✓ Đã xác nhận ký
                  </span>
                </div>
              ) : (
                <div className="py-4">
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 font-bold rounded-full text-xs">
                    ⏳ Chờ khách ký
                  </span>
                </div>
              )}
            </div>

            {/* Chữ ký Bên B */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 text-center space-y-2">
              <span className="text-[11px] font-bold text-slate-600 uppercase block">Đại diện Bên B (Admin Công Ty)</span>
              {contract?.adminSignatureImg ? (
                <div className="space-y-1">
                  <img
                    src={contract.adminSignatureImg}
                    alt="Chữ ký Admin"
                    className="h-16 max-w-full mx-auto object-contain bg-slate-50 rounded-lg p-1 border border-slate-100"
                  />
                  <span className="text-[10.5px] text-emerald-700 font-bold block">✓ Đã ký &amp; đóng dấu</span>
                  {contract.adminSignedAt && (
                    <span className="text-[10px] text-slate-400 block">
                      {new Date(contract.adminSignedAt).toLocaleString("vi-VN")}
                    </span>
                  )}
                </div>
              ) : contract?.adminSigned ? (
                <div className="py-4">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-full text-xs">
                    ✓ Đã xác nhận ký
                  </span>
                </div>
              ) : (
                <div className="py-4 space-y-2">
                  <span className="px-3 py-1 bg-rose-100 text-rose-800 font-bold rounded-full text-xs block">
                    ⚠️ Admin chưa ký
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setContractModalOpen(false);
                      setConfirmDepositModal(true);
                    }}
                    className="px-3 py-1 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-700 cursor-pointer shadow-xs"
                  >
                    Ký duyệt ngay
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => exportContractPDF(contract, order)}
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Xuất File PDF / In Hợp Đồng</span>
            </button>

            <button
              type="button"
              onClick={() => setContractModalOpen(false)}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </Modal>

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

      {/* Modal Phóng To Ảnh Khảo Sát */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-3xl overflow-hidden shadow-2xl p-2">
            <img
              src={previewImage}
              alt="Ảnh hiện trạng khảo sát"
              className="w-full h-auto max-h-[85vh] object-contain rounded-2xl"
            />
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 hover:bg-black text-white font-bold flex items-center justify-center text-sm cursor-pointer transition shadow-md"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}