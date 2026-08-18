import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  RefreshCw,
  Home,
  CreditCard,
  CheckCircle2,
  User,
  Phone,
  ShieldCheck,
  Check,
  Building,
  Calendar,
  Clock,
  MapPin,
  FileSignature,
  Sparkles,
  Printer,
  Download,
} from "lucide-react";
import AxiosConfig from "../../util/AxiosConfig";
import StatusBadge from "../../components/common/StatusBadge";
import PaymentSection from "../../components/payment/PaymentSection";
import Modal from "../../components/common/Modal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { formatMoney } from "../../util/formatters";
import { exportContractPDF } from "../../util/contractPdfExport";

function parseImageUrls(str) {
  if (!str) return [];
  if (Array.isArray(str)) return str;
  try {
    const parsed = JSON.parse(str);
    return Array.isArray(parsed) ? parsed : [str];
  } catch (e) {
    return str.split(",").map((s) => s.trim()).filter(Boolean);
  }
}

function formatDate(dateInput) {
  if (Array.isArray(dateInput)) {
    const [year, month, day] = dateInput;
    return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
  }
  if (!dateInput) return "—";
  try {
    const d = new Date(dateInput);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("vi-VN");
    }
  } catch (e) { }
  return String(dateInput).split("T")[0];
}

// 6 Bước tiến trình chuẩn hoá
const STAGES = [
  {
    id: 1,
    title: "1. Khảo sát & Tư vấn",
    desc: "Giám sát viên liên hệ khảo sát",
    statuses: ["PENDING", "SURVEY_ASSIGNED", "ACCEPTED"],
  },
  {
    id: 2,
    title: "2. Báo giá & Hợp đồng",
    desc: "Duyệt báo giá & ký hợp đồng điện tử",
    statuses: [
      "WAITING_ADMIN_QUOTE",
      "CUSTOMER_ACCEPTED_QUOTE",
      "WAITING_CONTRACT_APPROVAL",
      "WAITING_CUSTOMER_SIGNATURE",
    ],
  },
  {
    id: 3,
    title: "3. Đặt cọc (30%)",
    desc: "Thanh toán cọc qua VNPay Sandbox",
    statuses: ["WAITING_DEPOSIT", "DEPOSIT_CONFIRMED"],
  },
  {
    id: 4,
    title: "4. Thi công sơn sửa",
    desc: "Đội thợ thi công & cập nhật nhật ký",
    statuses: ["ASSIGNED", "PROCESSING"],
  },
  {
    id: 5,
    title: "5. Nghiệm thu",
    desc: "Khách hàng kiểm tra & nghiệm thu",
    statuses: ["WORKER_COMPLETED"],
  },
  {
    id: 6,
    title: "6. Tất toán & Hoàn tất",
    desc: "Thanh toán 70% còn lại & bảo hành",
    statuses: ["WAITING_FINAL_PAYMENT", "COMPLETED", "PAID_TO_STAFF"],
  },
];

function getActiveStageIndex(currentStatus) {
  if (!currentStatus || currentStatus === "CANCELLED") return 0;
  if (["PENDING", "SURVEY_ASSIGNED", "ACCEPTED"].includes(currentStatus)) return 0;
  if (["WAITING_ADMIN_QUOTE", "CUSTOMER_ACCEPTED_QUOTE", "WAITING_CONTRACT_APPROVAL", "WAITING_CUSTOMER_SIGNATURE"].includes(currentStatus)) return 1;
  if (["WAITING_DEPOSIT", "DEPOSIT_CONFIRMED"].includes(currentStatus)) return 2;
  if (["ASSIGNED", "PROCESSING"].includes(currentStatus)) return 3;
  if (["WORKER_COMPLETED"].includes(currentStatus)) return 4;
  if (["WAITING_FINAL_PAYMENT", "COMPLETED", "PAID_TO_STAFF"].includes(currentStatus)) return 5;
  return 0;
}

/* -------------------------------------------------------------------------- */
/* Contract Modal (Xem 2 chữ ký & Vẽ Ký điện tử & Xuất PDF)                   */
/* -------------------------------------------------------------------------- */
function ContractModal({ isOpen, onClose, contract, booking, bookingStatus, showToast, onSuccess }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const canSignContract =
    contract &&
    !contract.customerSigned &&
    ["WAITING_CUSTOMER_SIGNATURE", "CUSTOMER_ACCEPTED_QUOTE"].includes(bookingStatus);

  const getCanvasPosition = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = "#1e3a8a";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const { x, y } = getCanvasPosition(event);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (event) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const { x, y } = getCanvasPosition(event);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleConfirm = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !contract?.id) return;
    const ctx = canvas.getContext("2d");
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const hasInk = pixels.some((value, index) => index % 4 === 3 && value > 0);

    if (!hasInk) {
      showToast?.("Vui lòng ký tên vào khung trước khi xác nhận!", "warning");
      return;
    }

    const signatureBase64 = canvas.toDataURL("image/png");

    try {
      const payload = {
        id: contract.id,
        bookingId: contract.bookingId,
        contractCode: contract.contractCode,
        content: contract.content,
        customerSigned: true,
        customerSignatureImg: signatureBase64,
        workerSigned: contract.workerSigned ?? false,
        workerSignatureImg: contract.workerSignatureImg ?? null,
      };

      await AxiosConfig.put(`/contracts/${contract.id}`, payload);
      showToast?.("Ký hợp đồng dịch vụ thành công!", "success");
      onSuccess?.();
      onClose?.();
    } catch (error) {
      console.error("Sign contract error:", error);
      showToast?.(error.response?.data?.message || "Không thể ký hợp đồng!", "error");
    }
  };

  if (!isOpen || !contract) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Hợp đồng dịch vụ sơn sửa nhà" size="lg">
      <div className="space-y-5 max-h-[80vh] overflow-y-auto px-1 text-slate-800">
        {/* Header Hợp Đồng Chuẩn */}
        <div className="text-center pb-3 border-b border-slate-200 space-y-1 bg-slate-50/50 p-4 rounded-2xl">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
            CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
          </h3>
          <p className="text-[11px] font-bold text-slate-600 underline">Độc lập - Tự do - Hạnh phúc</p>
          <div className="pt-2">
            <h4 className="text-base font-black text-blue-900 uppercase">
              HỢP ĐỒNG DỊCH VỤ THI CÔNG SƠN SỬA CÔNG TRÌNH
            </h4>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Mã số HĐ: <strong className="text-slate-900">{contract.contractCode || "HĐ-" + contract.id}</strong> | Ngày lập:{" "}
              {contract.createdAt ? new Date(contract.createdAt).toLocaleDateString("vi-VN") : new Date().toLocaleDateString("vi-VN")}
            </p>
          </div>
        </div>

        {/* Thông tin 2 bên giao kết */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
          <div className="space-y-1">
            <span className="font-bold text-slate-900 block border-b border-slate-200 pb-1 uppercase tracking-wider text-[11px]">
              Bên A (Khách hàng / Chủ nhà):
            </span>
            <p>Họ tên: <strong>{booking?.customerName || booking?.customer?.fullName || booking?.customer?.username || "Khách hàng"}</strong></p>
            <p>SĐT: <strong>{booking?.customerPhone || booking?.customer?.phoneNumber || "—"}</strong></p>
            <p>Địa chỉ công trình: <strong>{booking?.address || "—"}</strong></p>
          </div>

          <div className="space-y-1">
            <span className="font-bold text-slate-900 block border-b border-slate-200 pb-1 uppercase tracking-wider text-[11px]">
              Bên B (Đơn vị thi công):
            </span>
            <p>Đơn vị: <strong>CÔNG TY DỊCH VỤ SƠN NHÀ 247</strong></p>
            <p>Tổng đài CSKH: <strong>1900 6868</strong></p>
            <p>Địa chỉ trụ sở: <strong>Hà Nội, Việt Nam</strong></p>
          </div>
        </div>

        {/* Hạng mục kinh phí & cam kết */}
        <div className="space-y-1.5 bg-blue-50/40 p-4 rounded-2xl border border-blue-100 text-xs">
          <span className="font-bold text-blue-950 block text-[11px] uppercase tracking-wider">
            Hạng mục thi công &amp; Cam kết:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 pt-1">
            <div>• Dịch vụ: <strong>{booking?.serviceName || booking?.service?.name || "Sơn sửa nhà"}</strong></div>
            <div>• Tổng dự toán: <strong className="text-emerald-700 font-bold">{formatMoney(booking?.totalAmount || 0)}</strong></div>
            <div>• Tiền cọc (30%): <strong className="text-slate-900">{formatMoney(booking?.depositAmount || (Number(booking?.totalAmount || 0) * 0.3))}</strong></div>
            <div>• Còn lại sau nghiệm thu (70%): <strong className="text-slate-900">{formatMoney(booking?.remainingAmount || (Number(booking?.totalAmount || 0) * 0.7))}</strong></div>
            <div>• Thời gian thi công: <strong>{booking?.estimatedDays || 3} ngày làm việc</strong></div>
            <div>• Thời hạn bảo hành: <strong>{booking?.warrantyYears || 2} năm chính hãng</strong></div>
          </div>
        </div>

        {/* Contract Content */}
        <div>
          <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
            Điều khoản hợp đồng chi tiết
          </div>
          <div className="p-4 bg-white border border-slate-200 rounded-2xl text-xs text-slate-700 leading-relaxed whitespace-pre-wrap max-h-[220px] overflow-y-auto shadow-inner">
            {contract.content || "1. Bên B cam kết thi công đúng kỹ thuật, sử dụng sơn chính hãng.\n2. Bên A thanh toán cọc 30% khi ký HĐ và tất toán 70% sau khi nghiệm thu đạt yêu cầu."}
          </div>
        </div>

        {/* 2 Chữ ký điện tử chính thức: Bên A (Khách hàng) & Bên B (Admin Công Ty) */}
        <div>
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center justify-between">
            <span>Chữ ký xác nhận 2 bên</span>
            {contract.adminSigned && contract.customerSigned && (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                ✓ Hợp đồng có đầy đủ 2 chữ ký
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Chữ ký Bên A (Khách hàng) */}
            <div className="border border-slate-200 bg-slate-50/70 rounded-2xl p-4 text-center space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Đại diện Bên A (Khách hàng)
              </div>
              <div className="h-20 bg-white rounded-xl flex items-center justify-center border border-slate-200 p-1">
                {contract.customerSignatureImg ? (
                  <img
                    src={contract.customerSignatureImg}
                    alt="Chữ ký khách hàng"
                    className="max-h-16 max-w-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-slate-400 italic">Chưa ký</span>
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  {booking?.customerName || booking?.customer?.fullName || "Khách hàng"}
                </p>
                {contract.customerSigned && (
                  <p className="text-[10px] text-emerald-700 font-bold mt-0.5">
                    ✓ Đã ký điện tử {contract.customerSignedAt ? `(${new Date(contract.customerSignedAt).toLocaleString("vi-VN")})` : ""}
                  </p>
                )}
              </div>
            </div>

            {/* Chữ ký Bên B (Admin Đại diện Công Ty) */}
            <div className="border border-slate-200 bg-slate-50/70 rounded-2xl p-4 text-center space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Đại diện Bên B (Admin Công Ty)
              </div>
              <div className="h-20 bg-white rounded-xl flex items-center justify-center border border-slate-200 p-1">
                {contract.adminSignatureImg ? (
                  <img
                    src={contract.adminSignatureImg}
                    alt="Chữ ký Admin"
                    className="max-h-16 max-w-full object-contain"
                  />
                ) : contract.adminSigned ? (
                  <span className="text-xs font-bold text-emerald-700">✓ Đã xác nhận ký</span>
                ) : (
                  <span className="text-xs text-amber-600 italic">⏳ Chờ Admin ký duyệt sau khi cọc</span>
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">CÔNG TY DỊCH VỤ SƠN NHÀ 247</p>
                {contract.adminSigned && (
                  <p className="text-[10px] text-emerald-700 font-bold mt-0.5">
                    ✓ Đã ký duyệt &amp; đóng dấu {contract.adminSignedAt ? `(${new Date(contract.adminSignedAt).toLocaleString("vi-VN")})` : ""}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Customer signing canvas */}
        {canSignContract && (
          <div className="border-t border-slate-200 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-800">
                  Ký xác nhận hợp đồng điện tử
                </div>
                <div className="text-[11px] text-slate-400">
                  Dùng chuột hoặc cảm ứng trên điện thoại để ký vào ô bên dưới
                </div>
              </div>
              <button
                type="button"
                onClick={clearSignature}
                className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
              >
                ✕ Ký lại
              </button>
            </div>

            <div className="border-2 border-dashed border-blue-300 rounded-2xl bg-slate-50/50 overflow-hidden">
              <canvas
                ref={canvasRef}
                width={600}
                height={160}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className="w-full h-[150px] cursor-crosshair touch-none bg-white"
              />
            </div>

            <button
              type="button"
              onClick={handleConfirm}
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition cursor-pointer"
            >
              ✍️ Xác nhận &amp; Lưu chữ ký hợp đồng
            </button>
          </div>
        )}

        {/* Bottom Actions: Nút Xuất PDF / In Hợp Đồng */}
        <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => exportContractPDF(contract, booking)}
            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Xuất File PDF / In Hợp Đồng</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* Main BookingDetail Page                                                    */
/* -------------------------------------------------------------------------- */
export default function BookingDetail({ user, showToast }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contractModal, setContractModal] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [acceptingQuote, setAcceptingQuote] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState("");
  const [dailyReports, setDailyReports] = useState([]);
  const [loadingDailyReports, setLoadingDailyReports] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const fetchBooking = async () => {
    try {
      const response = await AxiosConfig.get(`/bookings/${id}`);
      setBooking(response.data);
      if (response.data?.expectedStartDate) {
        setSelectedStartDate(response.data.expectedStartDate);
      } else {
        const tmrw = new Date(Date.now() + 86400000).toISOString().split("T")[0];
        setSelectedStartDate(tmrw);
      }
    } catch (error) {
      console.error("Load booking detail error:", error);
      showToast?.("Không tải được thông tin đơn hàng!", "error");
    }
  };

  const fetchContract = async () => {
    try {
      const response = await AxiosConfig.get("/contracts");
      const contracts = Array.isArray(response.data) ? response.data : [];
      const found = contracts.find((item) => Number(item.bookingId) === Number(id));
      setContract(found || null);
    } catch (error) {
      console.error("Load contract error:", error);
      setContract(null);
    }
  };

  const fetchDailyReports = async () => {
    try {
      setLoadingDailyReports(true);
      const response = await AxiosConfig.get(`/daily-reports/booking/${id}`);
      setDailyReports(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Load daily reports error:", error);
      setDailyReports([]);
    } finally {
      setLoadingDailyReports(false);
    }
  };

  const refreshData = async () => {
    await Promise.all([fetchBooking(), fetchContract(), fetchDailyReports()]);
  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    const load = async () => {
      setLoading(true);
      await refreshData();
      setLoading(false);
    };
    load();
  }, [id, user]);

  // Đồng ý báo giá, chọn ngày thi công và mở Modal ký hợp đồng
  const handleAcceptQuoteAndOpenContract = async () => {
    if (!selectedStartDate) {
      showToast?.("Vui lòng chọn ngày bắt đầu thi công mong muốn!", "warning");
      return;
    }
    const today = new Date().toISOString().split("T")[0];
    const maxDate = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
    if (selectedStartDate < today) {
      showToast?.("Ngày bắt đầu thi công không thể là ngày trong quá khứ!", "error");
      return;
    }
    if (selectedStartDate > maxDate) {
      showToast?.("Ngày bắt đầu thi công không được cách thời điểm xác nhận quá 30 ngày!", "error");
      return;
    }

    try {
      setAcceptingQuote(true);
      await AxiosConfig.put(`/bookings/${id}`, {
        ...booking,
        expectedStartDate: selectedStartDate,
        status: "WAITING_CUSTOMER_SIGNATURE",
      });
      showToast?.("Đã xác nhận ngày thi công! Vui lòng ký hợp đồng điện tử.", "success");
      await refreshData();
      setContractModal(true);
    } catch (err) {
      showToast?.(err.response?.data?.message || "Không thể xác nhận ngày thi công!", "error");
    } finally {
      setAcceptingQuote(false);
    }
  };

  // Khách hàng nghiệm thu công trình
  const handleCustomerAccept = () => {
    setConfirmDialog({
      title: "Nghiệm thu công trình sơn nhà",
      message:
        "Bạn xác nhận công trình đã được thi công hoàn thiện đạt yêu cầu chất lượng?\n\nSau khi nghiệm thu, bạn có thể tiến hành thanh toán phần còn lại (70%) qua VNPay Sandbox hoặc VietQR.",
      onConfirm: async () => {
        try {
          // 1. Nghiệm thu chi tiết
          try {
            const res = await AxiosConfig.get(`/booking-details/booking/${id}`);
            const details = Array.isArray(res.data) ? res.data : [];
            const pending = details.filter((d) => !d.customerAccepted);
            if (pending.length > 0) {
              await Promise.all(
                pending.map((d) => AxiosConfig.post(`/booking-details/${d.id}/customer-accept`))
              );
            }
          } catch (e) {
            console.warn("No separate booking details found or error, updating booking directly");
          }

          // 2. Cập nhật booking customerAccepted = true & chuyển trạng thái sang WAITING_FINAL_PAYMENT (Chờ tất toán)
          await AxiosConfig.put(`/bookings/${id}`, {
            ...booking,
            customerAccepted: true,
            status: "WAITING_FINAL_PAYMENT",
          });

          showToast?.("Nghiệm thu công trình thành công! Đã chuyển sang trạng thái chờ tất toán 70%.", "success");
          await refreshData();
        } catch (error) {
          console.error(error);
          showToast?.(error.response?.data?.message || "Không thể nghiệm thu công trình!", "error");
        } finally {
          setConfirmDialog(null);
        }
      },
    });
  };

  if (loading) return <LoadingSpinner />;

  if (!booking) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-sm w-full">
          <div className="text-4xl mb-3">📋</div>
          <h2 className="font-bold text-slate-800 text-base">Không tìm thấy đơn hàng #{id}</h2>
          <button
            type="button"
            onClick={() => navigate("/customer/ongoing")}
            className="mt-4 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold cursor-pointer"
          >
            Về Quản lý yêu cầu
          </button>
        </div>
      </div>
    );
  }

  const activeStage = getActiveStageIndex(booking.status);
  const canAcceptQuote =
    ["WAITING_CUSTOMER_SIGNATURE", "WAITING_ADMIN_QUOTE", "CUSTOMER_ACCEPTED_QUOTE"].includes(booking.status) &&
    Number(booking.totalAmount) > 0 &&
    (!contract || !contract.customerSigned);
  const canCustomerConfirmAcceptance =
    booking.status === "WORKER_COMPLETED" && !booking.customerAccepted;
  const isFinalPaid = Boolean(booking.finalPaid || booking.paymentStatus === "FULLY_PAID");

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/customer/ongoing")}
            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 font-bold transition cursor-pointer shrink-0"
            title="Quay lại danh sách yêu cầu"
          >
            <ArrowLeft className="w-4 h-4 text-slate-700" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900">
                Chi tiết đơn #{booking.id}
              </h1>
              <StatusBadge status={booking.status} />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Tạo ngày {formatDate(booking.createdAt || booking.appointmentDate)} • Dịch vụ:{" "}
              <span className="font-bold text-slate-700">{booking.serviceName || booking.service?.name || "Sơn sửa nhà"}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {contract && (
            <button
              type="button"
              onClick={() => setContractModal(true)}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <FileText className="w-3.5 h-3.5 text-white" />
              <span>{contract.customerSigned ? "Xem Hợp Đồng" : "Ký Hợp Đồng"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={refreshData}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition cursor-pointer"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Progress Stepper (6 Giai đoạn) */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Tiến trình thực hiện công trình
          </h3>
          <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-full">
            Bước {activeStage + 1} / 6
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          {STAGES.map((stg, idx) => {
            const isPassed = idx < activeStage;
            const isCurrent = idx === activeStage;
            return (
              <div
                key={stg.id}
                className={`p-3 rounded-2xl border transition text-left ${isCurrent
                    ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                    : isPassed
                      ? "bg-slate-50 text-slate-900 border-slate-200"
                      : "bg-slate-50/50 text-slate-400 border-slate-100"
                  }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-bold uppercase ${isCurrent ? "text-slate-300" : isPassed ? "text-slate-600" : "text-slate-400"}`}>
                    Bước {idx + 1}
                  </span>
                  <span className="text-xs font-bold">
                    {isPassed ? "✓" : isCurrent ? "●" : "○"}
                  </span>
                </div>
                <div className={`text-xs font-bold truncate ${isCurrent ? "text-white" : isPassed ? "text-slate-800" : "text-slate-600"}`}>
                  {stg.title.replace(/^\d+\.\s*/, "")}
                </div>
                <div className={`text-[10px] mt-0.5 line-clamp-1 ${isCurrent ? "text-slate-300" : "text-slate-400"}`}>
                  {stg.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid: 2 Cột chi tiết */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Thông tin công trình, Báo giá, Hợp đồng, Nghiệm thu */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Thông tin công trình & Lịch hẹn */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Home className="w-4 h-4 text-slate-700" />
              <span>Thông tin công trình &amp; Khảo sát</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <span className="text-slate-400 font-bold block mb-1">Địa chỉ công trình (Hà Nội)</span>
                <span className="text-slate-800 font-bold text-sm leading-snug">
                  {booking.address || "Chưa có địa chỉ"}
                </span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <span className="text-slate-400 font-bold block mb-1">Thời gian hẹn khảo sát</span>
                <span className="text-slate-800 font-bold text-sm">
                  {formatDate(booking.appointmentDate)} • {booking.appointmentTime || "08:00"}
                </span>
              </div>
            </div>

            {booking.description && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
                <span className="text-slate-400 font-bold block mb-1">Yêu cầu &amp; Mô tả hiện trạng của bạn:</span>
                <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {booking.description}
                </p>
              </div>
            )}
          </div>

          {/* Card 2: Báo giá, Dự toán & Chọn ngày thi công */}
          {Number(booking.totalAmount) > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>Báo giá dịch vụ &amp; Dự toán thi công</span>
                </h3>
                {canAcceptQuote ? (
                  <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                    Chờ bạn chọn ngày &amp; ký HĐ
                  </span>
                ) : (
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Đã duyệt báo giá
                  </span>
                )}
              </div>

              {/* Chi tiết dự toán */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-slate-500 font-semibold">Tổng chi phí thi công</div>
                    <div className="text-2xl font-black text-slate-900 mt-0.5">
                      {formatMoney(booking.totalAmount)}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Đặt cọc 30%: <strong className="text-emerald-700">{formatMoney(booking.depositAmount || Number(booking.totalAmount) * 0.3)}</strong>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500 font-semibold">Thời gian thi công dự kiến</div>
                    <div className="text-xl font-black text-slate-800 mt-0.5 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      <span>{booking.estimatedDays || 3} ngày làm việc</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Còn lại 70%: <strong className="text-slate-700">{formatMoney(booking.remainingAmount || Number(booking.totalAmount) * 0.7)}</strong>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500 font-semibold">Chế độ bảo hành</div>
                    <div className="text-xl font-black text-emerald-700 mt-0.5 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>{booking.warrantyYears || 2} năm bảo hành</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Cam kết sơn chính hãng 100%
                    </div>
                  </div>
                </div>

                {/* Chọn ngày bắt đầu thi công nếu đang chờ ký */}
                {canAcceptQuote && (
                  <div className="pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div className="space-y-1.5 flex-1 max-w-sm">
                      <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Chọn ngày bắt đầu thi công mong muốn <span className="text-rose-500">*</span></span>
                      </label>
                      <input
                        type="date"
                        min={new Date().toISOString().split("T")[0]}
                        max={new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]}
                        value={selectedStartDate}
                        onChange={(e) => setSelectedStartDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 shadow-xs"
                      />
                      <p className="text-[10.5px] text-slate-400">
                        * Bạn có thể chọn ngày làm trong vòng 30 ngày tới kể từ hôm nay.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAcceptQuoteAndOpenContract}
                      disabled={acceptingQuote || !selectedStartDate}
                      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs transition shadow-xs cursor-pointer shrink-0 flex items-center justify-center gap-2"
                    >
                      <FileSignature className="w-4 h-4 text-white" />
                      <span>{acceptingQuote ? "Đang xử lý..." : "✓ Đồng ý Báo Giá & Ký Hợp Đồng"}</span>
                    </button>
                  </div>
                )}

                {/* Đã chọn ngày làm */}
                {!canAcceptQuote && booking.expectedStartDate && (
                  <div className="pt-3 border-t border-slate-200/80 flex items-center gap-2 text-xs text-slate-700">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span>Ngày bắt đầu thi công đã cam kết: <strong className="text-slate-900">{formatDate(booking.expectedStartDate)}</strong></span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Card 3: Thanh toán Cọc & Tất toán */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-slate-700" />
              <span>Thanh toán tiền cọc &amp; Tất toán</span>
            </h3>

            <PaymentSection
              booking={booking}
              contract={contract}
              onOpenContract={() => setContractModal(true)}
              showToast={showToast}
              onRefresh={refreshData}
            />
          </div>

          {/* Card: Nhật ký & Báo cáo tiến độ thi công thực tế */}
          {(dailyReports.length > 0 || ["ASSIGNED", "PROCESSING", "WORKER_COMPLETED", "COMPLETED", "PAID_TO_STAFF"].includes(booking.status)) && (
            <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Nhật Ký &amp; Tiến Độ Thi Công Hàng Ngày
                  </h3>
                </div>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {dailyReports.length} cập nhật
                </span>
              </div>

              {loadingDailyReports ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  Đang tải nhật ký thi công...
                </div>
              ) : dailyReports.length === 0 ? (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-500 flex items-center gap-2">
                  <span className="text-base">🕒</span>
                  <span>Đội thợ đang thi công công trình. Báo cáo hình ảnh và tiến độ hàng ngày sẽ được cập nhật tại đây.</span>
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
                            <span className="font-bold text-xs text-slate-900 bg-slate-200 px-2 py-0.5 rounded-md">
                              📅 Báo cáo ngày #{dailyReports.length - index}
                            </span>
                            <span className="text-xs text-slate-600 font-medium">
                              Cập nhật bởi: <strong className="text-slate-900">@{report.reporterName || "Đội thợ"}</strong>
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

                        {report.progressPercentage != null && (
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, Math.max(0, report.progressPercentage))}%` }}
                            />
                          </div>
                        )}

                        <p className="text-xs text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">
                          {report.content}
                        </p>

                        {report.materialShortage && (
                          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-1">
                            <span className="font-bold text-amber-900 flex items-center gap-1.5">
                              <span>⚠️</span> Ghi chú vật tư phát sinh:
                            </span>
                            <p className="text-amber-800 font-medium whitespace-pre-wrap">
                              {report.materialShortage}
                            </p>
                          </div>
                        )}

                        {reportImages.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                              <span>📸</span> Hình ảnh thi công ({reportImages.length} ảnh):
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
          )}

          {/* Card 4: Nghiệm thu công trình */}
          {canCustomerConfirmAcceptance && (
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-200 text-slate-800 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Đội thợ đã báo hoàn thành thi công!
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Vui lòng kiểm tra thực tế công trình sơn sửa và bấm nút Nghiệm thu bên dưới để xác nhận hoàn tất.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCustomerAccept}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Xác nhận Nghiệm thu công trình đạt yêu cầu</span>
              </button>
            </div>
          )}

          {/* Card 4b: Đã nghiệm thu xong - Thanh toán 70% còn lại bằng VNPay */}
          {Boolean(booking.customerAccepted) && !isFinalPaid && (
            <div className="bg-amber-50 border border-amber-300 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-950">
                    ✓ Đã nghiệm thu công trình đạt yêu cầu!
                  </h4>
                  <p className="text-xs text-amber-800 mt-0.5 font-medium">
                    Quý khách vui lòng tiến hành tất toán 70% còn lại ({formatMoney(booking.remainingAmount || (Number(booking.totalAmount) * 0.7))}) qua cổng VNPay Sandbox để hoàn tất đơn hàng và nhận bảo hành điện tử.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={async () => {
                  try {
                    const res = await AxiosConfig.post(`/payments/vnpay/create?bookingId=${booking.id}&paymentType=FINAL`);
                    if (res.data?.paymentUrl) {
                      showToast?.("Đang chuyển hướng sang cổng thanh toán VNPay Sandbox...", "info");
                      window.location.href = res.data.paymentUrl;
                    } else {
                      showToast?.("Không tạo được liên kết VNPay", "error");
                    }
                  } catch (e) {
                    showToast?.(e.response?.data?.message || "Lỗi tạo liên kết thanh toán VNPay", "error");
                  }
                }}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <CreditCard className="w-4 h-4 text-white" />
                <span>Thanh toán tất toán (70%) qua VNPay Sandbox ngay</span>
              </button>
            </div>
          )}
        </div>

        {/* Right 1 Col: Đội ngũ nhân sự, Hợp đồng card, Ghi chú */}
        <div className="space-y-6">
          {/* Card Nhân sự phụ trách */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Nhân sự phụ trách đơn hàng
            </h4>

            {/* Giám sát viên */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-slate-200/80 px-2 py-0.5 rounded-md inline-block">
                Giám sát / Khảo sát
              </div>
              <div className="font-bold text-slate-900 text-xs">
                {booking.surveyorName || (booking.surveyor ? booking.surveyor.username : "Đang phân công")}
              </div>
              {booking.surveyorPhone && (
                <div className="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <a href={`tel:${booking.surveyorPhone}`} className="text-slate-800 hover:underline">
                    {booking.surveyorPhone}
                  </a>
                </div>
              )}
            </div>

            {/* Đội thợ thi công */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-slate-200/80 px-2 py-0.5 rounded-md inline-block">
                Kỹ thuật viên / Thợ sơn
              </div>
              <div className="font-bold text-slate-900 text-xs">
                {booking.technicianName || booking.preferredTechnicianName || "Chưa phân công"}
              </div>
              {booking.technicianPhone && (
                <div className="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <a href={`tel:${booking.technicianPhone}`} className="text-slate-800 hover:underline">
                    {booking.technicianPhone}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Card Hợp Đồng */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Hợp đồng điện tử
            </h4>

            {contract ? (
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1">
                  <div className="text-slate-500">Mã hợp đồng:</div>
                  <div className="font-bold text-slate-800">{contract.contractCode || "HĐ-" + contract.id}</div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Trạng thái:{" "}
                    {contract.customerSigned ? (
                      <span className="font-bold text-emerald-600">Đã ký kết ✓</span>
                    ) : (
                      <span className="font-bold text-amber-600">Chưa ký</span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setContractModal(true)}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <FileSignature className="w-3.5 h-3.5" />
                  <span>{contract.customerSigned ? "Xem nội dung Hợp Đồng" : "Ký hợp đồng điện tử"}</span>
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Hợp đồng điện tử sẽ được tạo sau khi khảo sát và duyệt báo giá.
              </p>
            )}
          </div>

          {/* Quick Links */}
          <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-xs space-y-3">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Cần hỗ trợ trực tiếp?
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Tổng đài CSKH và kỹ thuật viên sẵn sàng giải đáp mọi thắc mắc về đơn hàng của bạn.
            </p>
            <div className="pt-1">
              <a
                href="tel:0987654321"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-950 font-bold rounded-xl text-xs transition"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Hotline: 0987.654.321</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Contract Modal */}
      <ContractModal
        isOpen={contractModal}
        onClose={() => setContractModal(false)}
        contract={contract}
        booking={booking}
        bookingStatus={booking.status}
        showToast={showToast}
        onSuccess={refreshData}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(confirmDialog)}
        onClose={() => setConfirmDialog(null)}
        onConfirm={() => confirmDialog?.onConfirm?.()}
        title={confirmDialog?.title}
        message={confirmDialog?.message}
        confirmColor="bg-slate-900 hover:bg-slate-800"
      />

      {/* Modal Phóng To Ảnh Tiến Độ */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-3xl overflow-hidden shadow-2xl p-2">
            <img
              src={previewImage}
              alt="Ảnh tiến độ thi công"
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
