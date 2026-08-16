import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import AxiosConfig from "../../../util/AxiosConfig";
import DashboardHeader from "../../../components/layout/DashboardHeader";
import StatusBadge from "../../../components/common/StatusBadge";
import LoadingSpinner from "../../../components/common/LoadingSpinner";
import Modal from "../../../components/common/Modal";
import OrderTimeline from "./OrderTimeline";

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, showToast } = useOutletContext();

  const [order, setOrder] = useState(null);
  const [bookingDetails, setBookingDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [supervisors, setSupervisors] = useState([]);
  const [workers, setWorkers] = useState([]);
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

  // Deposit Confirm & Admin Sign
  const [confirmDepositModal, setConfirmDepositModal] = useState(false);
  const adminSigCanvasRef = useRef(null);
  const [hasAdminSignature, setHasAdminSignature] = useState(false);

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

  const [payments, setPayments] = useState([]);

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
        const [orderRes, supRes, workerRes] = await Promise.all([
          AxiosConfig.get(`/bookings/${id}`),
          AxiosConfig.get("/staff?staffType=SUPERVISOR").catch(() => ({ data: [] })),
          AxiosConfig.get("/staff?staffType=WORKER").catch(() => ({ data: [] })),
        ]);

        if (!isMounted) return;

        setOrder(orderRes.data);

        const rawSupList = supRes.data?.content || supRes.data?.data || supRes.data || [];
        const rawWorkerList = workerRes.data?.content || workerRes.data?.data || workerRes.data || [];

        const availableWorkers = (Array.isArray(rawWorkerList) ? rawWorkerList : []).filter(
          (s) => s.available !== false && s.staffType !== "SUPERVISOR"
        );

        setSupervisors(Array.isArray(rawSupList) ? rawSupList : []);
        setWorkers(availableWorkers);

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
  }, [id, fetchBookingDetail, fetchContract, fetchDailyReports, showToast]);

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
      showToast?.("Đã phân công Giám sát đi khảo sát!");
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
        customerSigned
          ? "Đã bàn giao đơn cho Đội thợ!"
          : "Đã gán đội thợ thành công!"
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

  // Cập nhật trạng thái Booking (cho các bước trung gian)
  const handleUpdateStatus = async (newStatus) => {
    try {
      await AxiosConfig.put(`/bookings/${id}`, { ...order, status: newStatus });
      showToast?.("Cập nhật trạng thái thành công!");
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
      showToast?.("Đã lập hợp đồng thành công, chờ khách ký!");
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
      const payload = { totalAmount: Number(quoteTotal) };
      if (quoteDeposit) payload.depositAmount = Number(quoteDeposit);

      await AxiosConfig.post(`/bookings/${id}/send-quote`, payload);
      showToast?.("Đã gửi báo giá cho khách hàng!");
      setQuoteModalOpen(false);
      fetchOrder();
    } catch (err) {
      showToast?.(err.response?.data?.message || "Lỗi gửi báo giá", "error");
    }
  };

  // Xác nhận cọc (deposit) và Admin ký HĐ
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
      if (contract && contract.id) {
        await AxiosConfig.post(`/contracts/${contract.id}/confirm-deposit`, {
          adminSignatureImg: signature
        });
        showToast?.("Xác nhận cọc và Admin ký hợp đồng thành công!");
      } else {
        // fallback
        await AxiosConfig.put(`/bookings/${id}`, { ...order, status: "DEPOSIT_CONFIRMED" });
      }
      setConfirmDepositModal(false);
      fetchOrder();
      fetchContract(id);
      fetchPayments(id);
    } catch (err) {
      showToast?.(err.response?.data?.message || "Lỗi xác nhận cọc", "error");
    }
  };


  // Thanh toán thù lao cho nhân viên (POST /api/bookings/{id}/pay-staff)
  const handlePayStaff = async () => {
    if (
      !window.confirm(
        "Xác nhận đã thanh toán tiền công cho Giám sát và Đội thợ?"
      )
    ) {
      return;
    }
    try {
      await AxiosConfig.post(`/bookings/${id}/pay-staff`);
      showToast?.("Đã xác nhận thanh toán thành công");
      fetchOrder();
    } catch (err) {
      showToast?.(
        err.response?.data?.message || "Lỗi xử lý thanh toán",
        "error"
      );
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!order) {
    return (
      <p className="text-center text-slate-400 py-20">
        Không tìm thấy đơn hàng
      </p>
    );
  }

  const customerSigned = !!contract?.customerSigned;
  const hasTechnician = !!(order.technicianId || order.technician);
  const isWorkerRejected = order.status === "WORKER_REJECTED";

  const canAssignSupervisor = order.status === "PENDING";
  const canAssignWorker = [
    "WAITING_CUSTOMER_SIGNATURE",
    "DEPOSIT_CONFIRMED",
    "CONTRACT_APPROVED",
    "WORKER_REJECTED",
    "ASSIGNED",
  ].includes(order.status);
  const canViewContract = !!contract;
  const canPayStaff =
    order.status === "WORKER_COMPLETED" || order.status === "FULLY_PAID";
  const canViewDailyReports = [
    "CONTRACT_APPROVED",
    "ASSIGNED",
    "ACCEPTED",
    "PROCESSING",
    "WORKER_COMPLETED",
    "COMPLETED",
    "WAITING_CUSTOMER_SIGNATURE",
  ].includes(order.status);

  const currentList = assignModal === "supervisor" ? supervisors : workers;

  const preferredWorkerName =
    order.preferredTechnicianName ||
    order.preferredTechnician?.fullName ||
    order.preferredTechnician?.username ||
    null;

  const preferredWorkerId =
    order.preferredTechnicianId || order.preferredTechnician?.id || null;

  // Lấy dữ liệu chi tiết báo cáo từ BookingDetails API nếu có
  const latestDetail = bookingDetails.length > 0 ? bookingDetails[0] : null;
  const surveyNoteText = latestDetail?.surveyNote || order.surveyNote;
  const materialNoteText = latestDetail?.materialNote || order.materialNote;
  const materialShortageText = latestDetail?.materialShortage || order.materialShortage;
  const surveyImages = parseImageUrls(latestDetail?.surveyImages || order.surveyImages);

  return (
    <div className="space-y-5">
      {/* Back */}
      <button
        onClick={() => navigate("/admin/bookings")}
        className="text-sm text-blue-600 hover:underline"
      >
        ← Quay lại danh sách
      </button>

      <DashboardHeader
        title={`Chi tiết đơn #${order.id}`}
        subtitle={order.address}
        userName={user?.username}
        userRole="Quản trị viên"
        avatarChar={(user?.username || "A").charAt(0).toUpperCase()}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ========== CỘT TRÁI ========== */}
        <div className="lg:col-span-2 space-y-5">
          {/* Thông tin đơn */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Thông tin đơn hàng</h3>
              <StatusBadge status={order.status} />
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <InfoItem
                label="Khách hàng"
                value={
                  order.customerName ||
                  order.customer?.fullName ||
                  order.customer?.username ||
                  "—"
                }
              />
              <InfoItem
                label="Số điện thoại"
                value={
                  order.customerPhone ||
                  order.phoneNumber ||
                  order.customer?.phoneNumber ||
                  "—"
                }
              />
              <InfoItem
                label="Giám sát"
                value={
                  order.surveyorName ||
                  order.supervisorName ||
                  order.surveyor?.username ||
                  "—"
                }
              />
              <InfoItem
                label="Thợ phụ trách"
                value={
                  order.technicianName ||
                  order.technician?.username ||
                  "—"
                }
              />
              <div className="col-span-2">
                <InfoItem
                  label="Đội thợ khách chọn"
                  value={
                    preferredWorkerName ||
                    "Không chỉ định (hệ thống tự chọn)"
                  }
                  highlight
                />
              </div>

              {(order.totalAmount != null || order.depositAmount != null) && (
                <div className="col-span-2 flex flex-wrap gap-3 text-xs bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                  <span>
                    <strong>Tổng:</strong> {formatMoney(order.totalAmount)}
                  </span>
                  <span>
                    <strong>Cọc:</strong> {formatMoney(order.depositAmount)}
                  </span>
                  <span>
                    <strong>Còn lại:</strong>{" "}
                    {formatMoney(order.remainingAmount)}
                  </span>
                </div>
              )}

              <div className="col-span-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase mb-0.5">
                  Mô tả từ khách
                </p>
                <p className="text-slate-700 text-sm">
                  {order.description || "Không có ghi chú"}
                </p>
              </div>
            </div>

            {/* Báo cáo khảo sát */}
            {(surveyNoteText || materialNoteText || materialShortageText || surveyImages.length > 0) && (
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase">
                  Báo cáo khảo sát
                </p>
                {surveyNoteText && (
                  <p className="text-sm text-slate-700">
                    <span className="font-semibold">Ghi chú: </span>
                    {surveyNoteText}
                  </p>
                )}
                {materialNoteText && (
                  <p className="text-sm text-slate-700">
                    <span className="font-semibold">Vật tư: </span>
                    {materialNoteText}
                  </p>
                )}
                {materialShortageText && (
                  <p className="text-sm text-amber-700">
                    <span className="font-semibold">Báo thiếu vật tư: </span>
                    {materialShortageText}
                  </p>
                )}
                {surveyImages.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    {surveyImages.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="aspect-square rounded-lg overflow-hidden border border-slate-200"
                      >
                        <img
                          src={url}
                          alt={`survey-${i}`}
                          className="w-full h-full object-cover hover:scale-105 transition"
                        />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Ảnh chuyển khoản / Biên lai từ khách hàng */}
            {payments.length > 0 && payments.some(p => p.proofImage) && (
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  💳 Biên lai chuyển khoản từ khách hàng
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {payments.filter(p => p.proofImage).map((p, i) => (
                    <div key={p.id || i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                        <span>{p.paymentType === "DEPOSIT" ? "Thanh toán Cọc" : "Thanh toán Tất toán"}</span>
                        <span className="text-emerald-600">{formatMoney(p.amount)}</span>
                      </div>
                      {p.note && <p className="text-xs text-slate-600 italic">"{p.note}"</p>}
                      <a
                        href={p.proofImage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-lg overflow-hidden border border-slate-200 max-h-48 bg-black/5"
                      >
                        <img
                          src={p.proofImage}
                          alt={`proof-${i}`}
                          className="w-full h-full object-contain max-h-48 hover:scale-105 transition"
                        />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!customerSigned && hasTechnician && (
              <p className="mt-3 text-[11px] text-amber-600">
                Đã gán thợ sẵn — chờ khách ký HĐ mới chính thức bàn giao.
              </p>
            )}
            {isWorkerRejected && (
              <div className="mt-3 p-2.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs">
                <strong>Đội thợ đã từ chối.</strong> Vui lòng gán thợ khác.
              </div>
            )}
          </div>

          {/* Báo cáo ngày (preview) */}
          {canViewDailyReports && (
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-800">
                  Báo cáo tiến độ ngày
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    fetchDailyReports(id);
                    setReportsModalOpen(true);
                  }}
                  className="text-xs font-semibold text-orange-600 hover:text-orange-700"
                >
                  Xem tất cả ({dailyReports.length})
                </button>
              </div>

              {loadingReports ? (
                <p className="text-sm text-slate-400 py-4 text-center">
                  Đang tải...
                </p>
              ) : dailyReports.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">
                  Chưa có báo cáo ngày nào.
                </p>
              ) : (
                <div className="space-y-2">
                  {dailyReports.slice(0, 3).map((r, idx) => {
                    const imgs = parseImageUrls(r.progressImages);
                    return (
                      <div
                        key={r.id || idx}
                        className="flex gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                            <span className="font-semibold text-slate-700">
                              #{dailyReports.length - idx}
                            </span>
                            <span>·</span>
                            <span>{r.reporterName || "—"}</span>
                            {r.createdAt && (
                              <>
                                <span>·</span>
                                <span>
                                  {new Date(r.createdAt).toLocaleString(
                                    "vi-VN",
                                    {
                                      day: "2-digit",
                                      month: "2-digit",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}
                                </span>
                              </>
                            )}
                            {r.progressPercentage != null && (
                              <span className="ml-auto font-bold text-orange-600">
                                {r.progressPercentage}%
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-700 line-clamp-2">
                            {r.content || "Không có nội dung"}
                          </p>
                          {imgs.length > 0 && (
                            <p className="text-[11px] text-slate-400 mt-1">
                              📷 {imgs.length} ảnh
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {dailyReports.length > 3 && (
                    <button
                      type="button"
                      onClick={() => setReportsModalOpen(true)}
                      className="w-full text-xs text-slate-500 hover:text-slate-700 py-1"
                    >
                      + {dailyReports.length - 3} báo cáo khác
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          <OrderTimeline history={order.history || []} />
        </div>

        {/* ========== CỘT PHẢI: HÀNH ĐỘNG ========== */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm sticky top-4">
            <h3 className="font-bold text-slate-800 mb-4 pb-3 border-b border-slate-100">
              Hành động
            </h3>

            <div className="space-y-2.5">
              {canAssignSupervisor && (
                <ActionBtn
                  color="blue"
                  onClick={() => {
                    setSelectedId("");
                    setAssignModal("supervisor");
                  }}
                >
                  Phân công Giám sát khảo sát
                </ActionBtn>
              )}

              {order.status === "SURVEY_ASSIGNED" && (
                <HintBox color="amber">
                  <strong>Đang khảo sát.</strong> Giám sát đo đạc và lập HĐ.
                </HintBox>
              )}

              {order.status === "WAITING_ADMIN_QUOTE" && (
                <>
                  <HintBox color="indigo">
                    <strong>Chờ duyệt báo cáo.</strong> Giám sát đã gửi báo cáo, hãy duyệt và gửi báo giá.
                  </HintBox>
                  <ActionBtn color="emerald" onClick={() => setQuoteModalOpen(true)}>
                    📨 Gửi báo giá cho khách
                  </ActionBtn>
                </>
              )}

              {order.status === "CUSTOMER_ACCEPTED_QUOTE" && (
                <>
                  <HintBox color="indigo">
                    <strong>Khách đã đồng ý.</strong> Vui lòng tạo hợp đồng.
                  </HintBox>
                  <ActionBtn color="blue" onClick={handleCreateContract}>
                    📝 Lập hợp đồng
                  </ActionBtn>
                </>
              )}

              {order.status === "WAITING_DEPOSIT" && (
                <>
                  <HintBox color="amber">
                    <strong>Chờ khách thanh toán cọc.</strong>
                  </HintBox>
                  <ActionBtn color="emerald" onClick={() => setConfirmDepositModal(true)}>
                    💰 Xác nhận đã nhận cọc &amp; Ký HĐ
                  </ActionBtn>
                </>
              )}

              {order.status === "DEPOSIT_CONFIRMED" && (
                <HintBox color="emerald">
                  <strong>Đã xác nhận tiền cọc!</strong> Vui lòng phân công Đội thợ thi công bên dưới.
                </HintBox>
              )}

              {order.status === "WAITING_CUSTOMER_SIGNATURE" && (
                <>
                  <HintBox color="amber">
                    <strong>Chờ khách ký.</strong> Đã duyệt HĐ, đang chờ ký điện
                    tử.
                  </HintBox>
                  {canViewContract && (
                    <ActionBtn
                      color="slate"
                      onClick={() => setContractModalOpen(true)}
                    >
                      📜 Xem hợp đồng
                    </ActionBtn>
                  )}
                </>
              )}

              {order.status === "CONTRACT_APPROVED" && customerSigned && (
                <>
                  <HintBox color="emerald">
                    <strong>Khách đã ký.</strong> Có thể bàn giao / bắt đầu thi
                    công.
                  </HintBox>
                  {canViewContract && (
                    <ActionBtn
                      color="slate"
                      onClick={() => setContractModalOpen(true)}
                    >
                      📜 Xem hợp đồng
                    </ActionBtn>
                  )}
                </>
              )}

              {isWorkerRejected && (
                <HintBox color="red">
                  <strong>Thợ từ chối.</strong> Gán đội thợ khác.
                </HintBox>
              )}

              {canAssignWorker && (
                <ActionBtn
                  color="teal"
                  onClick={() => {
                    setSelectedId(String(preferredWorkerId || ""));
                    setAssignModal("worker");
                  }}
                >
                  {isWorkerRejected || !hasTechnician
                    ? "Gán Đội thợ thi công"
                    : "Thay đổi / Gán lại Đội thợ"}
                </ActionBtn>
              )}

              {order.status === "PROCESSING" && (
                <>
                  <HintBox color="blue">
                    <strong>Đang thi công.</strong> Đội thợ cập nhật nhật ký
                    ngày.
                  </HintBox>
                  {canViewContract && (
                    <ActionBtn
                      color="slate"
                      onClick={() => setContractModalOpen(true)}
                    >
                      📜 Xem hợp đồng
                    </ActionBtn>
                  )}
                </>
              )}

              {order.status === "WORKER_COMPLETED" && (
                <HintBox color="purple">
                  <strong>Thợ hoàn thành.</strong> Chờ nghiệm thu / thanh toán.
                </HintBox>
              )}

              {canPayStaff && (
                <ActionBtn color="emerald" onClick={handlePayStaff}>
                  Xác nhận thanh toán tiền công
                </ActionBtn>
              )}

              {canViewDailyReports && (
                <ActionBtn
                  color="orange"
                  onClick={() => {
                    fetchDailyReports(id);
                    setReportsModalOpen(true);
                  }}
                >
                  📅 Báo cáo ngày ({dailyReports.length})
                </ActionBtn>
              )}

              {canViewContract &&
                ![
                  "WAITING_CONTRACT_APPROVAL",
                  "WAITING_CUSTOMER_SIGNATURE",
                  "CONTRACT_APPROVED",
                  "PROCESSING",
                ].includes(order.status) && (
                  <ActionBtn
                    color="slate"
                    onClick={() => setContractModalOpen(true)}
                  >
                    📜 Xem hợp đồng
                  </ActionBtn>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal chọn NV */}
      <Modal
        isOpen={!!assignModal}
        onClose={() => setAssignModal(null)}
        title={
          assignModal === "supervisor"
            ? "Phân công Giám sát khảo sát"
            : "Gán / đổi Đội thợ thi công"
        }
      >
        <div className="space-y-4">
          {currentList.length === 0 ? (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-sm space-y-2">
              <p className="font-semibold">
                Không tìm thấy{" "}
                {assignModal === "supervisor" ? "Giám sát" : "Thợ"} khả dụng.
              </p>
              <button
                type="button"
                onClick={() => navigate("/admin/employees")}
                className="px-3 py-1.5 bg-amber-600 text-white font-bold rounded-lg text-xs hover:bg-amber-700"
              >
                + Thêm nhân viên
              </button>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                {assignModal === "supervisor" ? "Giám sát viên" : "Đội thợ"}
              </label>
              <select
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
              >
                <option value="">-- Chọn --</option>
                {currentList.map((s) => {
                  const sId = String(s.userId || s.id);
                  const isPreferred =
                    assignModal === "worker" &&
                    preferredWorkerId &&
                    String(preferredWorkerId) === sId;
                  return (
                    <option key={sId} value={sId}>
                      {s.fullName || s.username || `NV #${sId}`}
                      {isPreferred ? " ★ (Khách chọn)" : ""}
                      {s.specialty ? ` – ${s.specialty}` : ""}
                      {s.available === false ? " (Bận)" : ""}
                    </option>
                  );
                })}
              </select>
              {assignModal === "worker" && !customerSigned && (
                <p className="text-[11px] text-amber-600 mt-2">
                  Gán sẵn. Chỉ sau khi khách ký HĐ mới chính thức bàn giao.
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => setAssignModal(null)}
              className="flex-1 py-2 bg-slate-100 font-bold text-slate-600 rounded-xl text-sm hover:bg-slate-200"
            >
              Hủy
            </button>
            {currentList.length > 0 && (
              <button
                type="button"
                onClick={
                  assignModal === "supervisor"
                    ? handleAssignSupervisor
                    : handleAssignWorker
                }
                className="flex-1 py-2 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700"
              >
                Xác nhận
              </button>
            )}
          </div>
        </div>
      </Modal>

      {/* Modal gửi báo giá */}
      <Modal
        isOpen={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
        title="Báo giá cho khách hàng"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Tổng báo giá (VNĐ) *
            </label>
            <input
              type="number"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold text-blue-600"
              value={quoteTotal}
              onChange={(e) => setQuoteTotal(e.target.value)}
              placeholder="VD: 15000000"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Tiền cọc yêu cầu (VNĐ)
            </label>
            <input
              type="number"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={quoteDeposit}
              onChange={(e) => setQuoteDeposit(e.target.value)}
              placeholder="Để trống = Mặc định 30%"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setQuoteModalOpen(false)}
              className="flex-1 py-2 bg-slate-100 font-bold text-slate-600 rounded-xl text-sm hover:bg-slate-200"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSendQuote}
              className="flex-1 py-2 bg-emerald-600 text-white font-bold rounded-xl text-sm hover:bg-emerald-700"
            >
              Gửi báo giá
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Xác nhận cọc và Admin Ký */}
      <Modal
        isOpen={confirmDepositModal}
        onClose={() => setConfirmDepositModal(false)}
        title="Xác nhận nhận cọc & Ký hợp đồng"
      >
        <div className="space-y-4">
          {/* Hiển thị ảnh biên lai cọc nếu khách đã tải lên */}
          {payments.filter(p => p.proofImage && p.paymentType === "DEPOSIT").length > 0 && (
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
              <p className="text-xs font-bold text-blue-800 uppercase tracking-wide">
                📸 Ảnh biên lai chuyển khoản do khách hàng gửi:
              </p>
              {payments.filter(p => p.proofImage && p.paymentType === "DEPOSIT").map((p, idx) => (
                <div key={idx} className="space-y-1.5">
                  <a
                    href={p.proofImage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg overflow-hidden border border-blue-200 bg-white max-h-52"
                  >
                    <img
                      src={p.proofImage}
                      alt="Biên lai cọc"
                      className="w-full h-full object-contain max-h-52"
                    />
                  </a>
                  {p.note && <p className="text-xs text-slate-600 italic">Ghi chú: {p.note}</p>}
                </div>
              ))}
            </div>
          )}

          <p className="text-sm text-slate-700">
            Vui lòng xác nhận rằng bạn đã nhận được tiền cọc từ khách hàng và ký tên đóng dấu với tư cách đại diện công ty (Admin).
          </p>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold text-slate-700">
                Chữ ký của Admin (Đại diện công ty) *
              </label>
              <button
                type="button"
                onClick={clearAdminSignature}
                className="text-xs text-rose-600 hover:underline font-bold"
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
                <span className="text-emerald-600 font-bold">✓ Đã ký tên xác nhận</span>
              ) : (
                <span className="text-amber-600 font-semibold">⚠️ Vui lòng ký tên vào khung trước khi xác nhận</span>
              )}
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setConfirmDepositModal(false)}
              className="flex-1 py-2 bg-slate-100 font-bold text-slate-600 rounded-xl text-sm hover:bg-slate-200"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirmDeposit}
              className="flex-1 py-2 bg-emerald-600 text-white font-bold rounded-xl text-sm hover:bg-emerald-700"
            >
              Xác nhận nhận cọc
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal hợp đồng */}
      <Modal
        isOpen={contractModalOpen}
        onClose={() => setContractModalOpen(false)}
        title="Chi tiết hợp đồng"
      >
        {contract ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <span>Mã: {contract.contractCode}</span>
              <span
                className={
                  contract.customerSigned ? "text-emerald-600" : "text-amber-500"
                }
              >
                {contract.customerSigned ? "Khách đã ký" : "Chờ khách ký"}
              </span>
            </div>

            {/* Trạng thái chữ ký tóm tắt */}
            <div className="flex flex-wrap gap-2 text-xs">
              <span
                className={
                  "px-2.5 py-1 rounded-full font-semibold " +
                  (contract.customerSigned
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-500")
                }
              >
                {contract.customerSigned
                  ? "✓ Khách đã ký"
                  : "○ Chờ khách ký"}
              </span>
              <span
                className={
                  "px-2.5 py-1 rounded-full font-semibold " +
                  (contract.adminSigned
                    ? "bg-purple-50 text-purple-700"
                    : "bg-slate-100 text-slate-500")
                }
              >
                {contract.adminSigned
                  ? "✓ Admin đã ký & duyệt"
                  : "○ Chờ Admin ký cọc"}
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap min-h-[160px] max-h-[300px] overflow-y-auto">
              {contract.content || "Chưa có nội dung"}
            </div>

            {/* Chữ ký Hợp đồng (chỉ giữ lại Khách hàng & Admin) */}
            {(contract.customerSignatureImg || contract.adminSignatureImg) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {contract.customerSignatureImg && (
                  <div className="border border-emerald-100 rounded-xl p-3 bg-emerald-50/40">
                    <p className="text-[10px] font-bold text-emerald-700 uppercase mb-2 tracking-wide">
                      Chữ ký khách hàng
                    </p>
                    <div className="bg-white rounded-lg border border-emerald-100 p-2 flex items-center justify-center min-h-[80px]">
                      <img
                        src={contract.customerSignatureImg}
                        alt="Chữ ký khách"
                        className="max-h-28 max-w-full object-contain"
                      />
                    </div>
                    {contract.customerSignedAt && (
                      <p className="text-[10px] text-slate-500 mt-1.5">
                        Ký lúc:{" "}
                        {new Date(contract.customerSignedAt).toLocaleString("vi-VN")}
                      </p>
                    )}
                  </div>
                )}
                {contract.adminSignatureImg && (
                  <div className="border border-purple-100 rounded-xl p-3 bg-purple-50/40">
                    <p className="text-[10px] font-bold text-purple-700 uppercase mb-2 tracking-wide">
                      Chữ ký Đại diện Công ty (Admin)
                    </p>
                    <div className="bg-white rounded-lg border border-purple-100 p-2 flex items-center justify-center min-h-[80px]">
                      <img
                        src={contract.adminSignatureImg}
                        alt="Chữ ký Admin"
                        className="max-h-28 max-w-full object-contain"
                      />
                    </div>
                    {contract.adminSignedAt && (
                      <p className="text-[10px] text-slate-500 mt-1.5">
                        Ký lúc:{" "}
                        {new Date(contract.adminSignedAt).toLocaleString("vi-VN")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500 py-4 text-center">
            Không tìm thấy thông tin hợp đồng.
          </p>
        )}
      </Modal>

      {/* Modal danh sách tất cả báo cáo ngày */}
      <Modal
        isOpen={reportsModalOpen}
        onClose={() => setReportsModalOpen(false)}
        title={`Tất cả báo cáo tiến độ (${dailyReports.length})`}
      >
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
          {dailyReports.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">
              Chưa có báo cáo ngày nào.
            </p>
          ) : (
            dailyReports.map((r, idx) => {
              const imgs = parseImageUrls(r.progressImages);
              return (
                <div
                  key={r.id || idx}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 text-sm space-y-2"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-bold text-slate-800">
                      #{dailyReports.length - idx} - {r.reporterName || "N/A"}
                    </span>
                    {r.progressPercentage != null && (
                      <span className="font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">
                        {r.progressPercentage}%
                      </span>
                    )}
                  </div>
                  <p className="text-slate-700 whitespace-pre-line">
                    {r.content || "Không có nội dung"}
                  </p>
                  {imgs.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      {imgs.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="aspect-square rounded-lg overflow-hidden border border-slate-200"
                        >
                          <img
                            src={url}
                            alt={`report-img-${i}`}
                            className="w-full h-full object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                  {r.createdAt && (
                    <p className="text-[10px] text-slate-400 text-right">
                      {new Date(r.createdAt).toLocaleString("vi-VN")}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Modal>
    </div>
  );
}

// Subcomponents trợ giúp hiển thị UI
function InfoItem({ label, value, highlight }) {
  return (
    <div>
      <p className="text-[11px] font-bold text-slate-400 uppercase mb-0.5">
        {label}
      </p>
      <p
        className={`text-sm ${highlight ? "font-semibold text-blue-600" : "text-slate-800"
          }`}
      >
        {value}
      </p>
    </div>
  );
}

function ActionBtn({ children, color, onClick, disabled }) {
  const colorMap = {
    blue: "bg-blue-600 hover:bg-blue-700 text-white",
    teal: "bg-teal-600 hover:bg-teal-700 text-white",
    indigo: "bg-indigo-600 hover:bg-indigo-700 text-white",
    emerald: "bg-emerald-600 hover:bg-emerald-700 text-white",
    orange: "bg-orange-600 hover:bg-orange-700 text-white",
    slate: "bg-slate-700 hover:bg-slate-800 text-white",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-2.5 px-4 rounded-xl font-bold text-sm transition shadow-sm disabled:opacity-50 ${colorMap[color] || colorMap.slate
        }`}
    >
      {children}
    </button>
  );
}

function HintBox({ children, color }) {
  const colorMap = {
    amber: "bg-amber-50 border-amber-200 text-amber-800",
    indigo: "bg-indigo-50 border-indigo-200 text-indigo-800",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-800",
    blue: "bg-blue-50 border-blue-200 text-blue-800",
    red: "bg-red-50 border-red-200 text-red-800",
    purple: "bg-purple-50 border-purple-200 text-purple-800",
  };

  return (
    <div
      className={`p-3 rounded-xl border text-xs leading-relaxed ${colorMap[color] || colorMap.amber
        }`}
    >
      {children}
    </div>
  );
}