import { useState, useEffect, useRef } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import AxiosConfig from "../../util/AxiosConfig";
import StatusBadge from "../../components/common/StatusBadge";
import Modal from "../../components/common/Modal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import LoadingSpinner from "../../components/common/LoadingSpinner";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateInput) {
  if (Array.isArray(dateInput)) {
    const [year, month, day] = dateInput;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  return dateInput || "";
}

function formatTime(timeInput) {
  if (!timeInput) return "08:00:00";
  return timeInput.length === 5 ? `${timeInput}:00` : timeInput;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function BookingForm({
  services,
  technicians,
  profile,
  editingBookingId,
  formState,
  setForm,
  onSubmit,
  onReset,
  loading,
}) {
  const {
    selectedServiceId,
    selectedTechnicianId,
    newDesc,
    address,
    appointmentDate,
    appointmentTime,
  } = formState;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
      <h3 className="text-base font-bold text-slate-900 mb-5 flex items-center gap-2">
        <span>📋</span>{" "}
        {editingBookingId ? "Chỉnh Sửa Yêu Cầu" : "Đăng Ký Khảo Sát Hiện Trạng"}
      </h3>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Service select */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">
            Hạng mục cần cải tạo
          </label>
          <select
            value={selectedServiceId}
            onChange={(e) => setForm("selectedServiceId", e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Technician picker */}
        <div>
          <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3 px-1">
            Lựa chọn đội ngũ thi công
          </label>
          <div className="border border-slate-200 rounded-xl bg-slate-50/50 p-2">
            <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-1 p-1">
              {/* Auto-assign option */}
              <TechCard
                selected={selectedTechnicianId === ""}
                onClick={() => setForm("selectedTechnicianId", "")}
                avatar="🤖"
                name="Hệ thống tự động điều phối"
                sub="Kỹ sư phù hợp nhất sẽ được chỉ định"
                isAuto
              />
              {technicians.map((tech) => {
                const techId = tech.userId ?? tech.id;
                return (
                  <TechCard
                    key={techId}
                    selected={String(selectedTechnicianId) === String(techId)}
                    onClick={() => setForm("selectedTechnicianId", String(techId))}
                    avatar={(tech.username || "T").charAt(0).toUpperCase()}
                    name={tech.username}
                    sub={tech.specialty || "Thợ thi công"}
                    phone={tech.phoneNumber}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              Ngày hẹn khảo sát
            </label>
            <input
              type="date"
              value={appointmentDate}
              onChange={(e) => setForm("appointmentDate", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              Giờ hẹn mong muốn
            </label>
            <input
              type="time"
              value={appointmentTime}
              onChange={(e) => setForm("appointmentTime", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">
            Địa chỉ công trình
          </label>
          <input
            type="text"
            placeholder="Ví dụ: Số 29, Ngõ 11, Quận Cầu Giấy, Hà Nội"
            value={address}
            onChange={(e) => setForm("address", e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">
            Mô tả hiện trạng &amp; Yêu cầu cụ thể
          </label>
          <textarea
            placeholder="Mô tả hiện trạng, yêu cầu sửa chữa..."
            value={newDesc}
            onChange={(e) => setForm("newDesc", e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 h-28 resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={profile?.status === "RESTRICTED" || loading}
            className={`flex-1 py-2.5 text-white font-bold rounded-lg text-sm shadow-sm transition-all ${
              profile?.status === "RESTRICTED" || loading
                ? "bg-slate-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Đang xử lý..." : editingBookingId ? "Cập Nhật Ngay" : "Gửi Yêu Cầu"}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg text-sm"
          >
            Làm mới
          </button>
        </div>
      </form>
    </div>
  );
}

function TechCard({ selected, onClick, avatar, name, sub, phone, isAuto }) {
  return (
    <div
      onClick={onClick}
      className={`relative cursor-pointer p-4 rounded-lg border-2 transition-all flex items-center gap-4 group ${
        selected
          ? "border-blue-600 bg-white shadow-md"
          : "border-slate-100 bg-white hover:border-blue-200 shadow-sm"
      }`}
    >
      <div
        className={`w-14 h-14 rounded-lg flex items-center justify-center font-black text-xl shadow-inner shrink-0 ${
          isAuto
            ? "bg-blue-50 text-2xl"
            : selected
            ? "bg-blue-600 text-white"
            : "bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600"
        }`}
      >
        {avatar}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-black text-slate-900">{name}</div>
        <div className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase inline-block mt-1">
          {sub}
        </div>
        {phone && <div className="text-[11px] text-slate-500 mt-1">📞 {phone}</div>}
      </div>
      {selected && (
        <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
          <span className="text-white text-[10px] font-black">✓</span>
        </div>
      )}
    </div>
  );
}

function BookingTable({
  bookings,
  services,
  technicians,
  onEdit,
  onDelete,
  onAccept,
  onViewContract,
  navigate,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");

  const filtered = bookings
    .filter((req) => {
      const srvName = services.find((s) => s.id === req.serviceId)?.name || "";
      const matchesName =
        !searchTerm ||
        srvName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (req.description || "").toLowerCase().includes(searchTerm.toLowerCase());
      const reqDate = formatDate(req.appointmentDate);
      const matchesStart = !startDate || reqDate >= startDate;
      const matchesEnd = !endDate || reqDate <= endDate;
      return matchesName && matchesStart && matchesEnd;
    })
    .sort((a, b) => {
      const dateA = formatDate(a.appointmentDate);
      const dateB = formatDate(b.appointmentDate);
      return sortOrder === "desc"
        ? dateB.localeCompare(dateA)
        : dateA.localeCompare(dateB);
    });

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
      <h3 className="text-base font-bold text-slate-900 mb-5 flex items-center gap-2">
        <span>🏗️</span> Tiến Độ Công Trình Của Bạn
      </h3>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-2 items-center">
        <div className="flex-1 min-w-[150px] relative">
          <input
            type="text"
            placeholder="Tìm theo hạng mục, mô tả..."
            className="w-full pl-8 pr-4 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px]">🔍</span>
        </div>
        <input
          type="date"
          className="px-2 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px]"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <span className="text-[10px] text-slate-400">→</span>
        <input
          type="date"
          className="px-2 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px]"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
        <select
          className="px-2 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px]"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
        >
          <option value="desc">Mới nhất</option>
          <option value="asc">Cũ nhất</option>
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-slate-400 text-sm">
          <div className="text-4xl mb-3">📋</div>
          <p className="font-semibold">Chưa có yêu cầu nào</p>
          <p className="text-xs mt-1">Hãy điền form bên trái để tạo yêu cầu khảo sát mới.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-xs font-bold tracking-wide uppercase">
                <th className="pb-3 pl-2">Mã</th>
                <th className="pb-3">Thời gian / Nhân sự</th>
                <th className="pb-3">Địa chỉ &amp; Mô tả</th>
                <th className="pb-3 pr-2 text-right">Trạng thái &amp; Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/70">
              {filtered.map((req) => (
                <tr
                  key={req.id}
                  className="text-sm text-slate-600 hover:bg-slate-50/40 transition-colors"
                >
                  <td className="py-4 pl-2 font-bold text-blue-600">#{req.id}</td>
                  <td className="py-4 font-semibold text-slate-800">
                    <div className="flex flex-col">
                      <span>
                        {formatDate(req.appointmentDate)} | {req.appointmentTime}
                      </span>
                      <span className="text-[10px] text-blue-500 font-bold uppercase tracking-tight">
                        {req.preferredTechnicianName ||
                          req.technicianName ||
                          technicians.find(
                            (t) =>
                              t.id === req.preferredTechnicianId ||
                              t.userId === req.preferredTechnicianId ||
                              t.id === req.technicianId
                          )?.username ||
                          "Đang chờ phân công"}
                      </span>
                    </div>
                  </td>
                  <td
                    className="py-4 max-w-[260px] truncate text-slate-500"
                    title={`${req.address} - ${req.description}`}
                  >
                    <span className="font-bold text-slate-700">{req.address}</span>
                    : {req.description}
                  </td>
                  <td className="py-4 pr-2 text-right">
                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge status={req.status} />
                      <div className="flex gap-3 flex-wrap justify-end">
                        <button
                          onClick={() => navigate(`/customer/bookings/${req.id}`)}
                          className="text-[10px] font-black text-blue-600 hover:underline cursor-pointer uppercase"
                        >
                          Xem chi tiết
                        </button>

                        {req.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => onEdit(req)}
                              className="text-[10px] font-black text-blue-600 hover:underline cursor-pointer uppercase"
                            >
                              Sửa
                            </button>
                            <button
                              onClick={() => onDelete(req.id)}
                              className="text-[10px] font-black text-rose-600 hover:underline cursor-pointer uppercase"
                            >
                              Xóa
                            </button>
                          </>
                        )}

                        {req.status === "WORKER_COMPLETED" && !req.customerAccepted && (
                          <button
                            onClick={() => onAccept(req.id)}
                            className="text-[10px] font-black text-purple-600 hover:underline cursor-pointer uppercase"
                          >
                            Nghiệm thu
                          </button>
                        )}

                        {req.status === "WORKER_COMPLETED" && req.customerAccepted && (
                          <span className="text-[10px] font-bold text-emerald-600 uppercase">
                            Đã nghiệm thu ✓
                          </span>
                        )}

                        {[
                          "WAITING_CONTRACT_APPROVAL",
                          "WAITING_CUSTOMER_SIGNATURE",
                          "ASSIGNED",
                          "PROCESSING",
                          "WORKER_COMPLETED",
                          "COMPLETED",
                        ].includes(req.status) && (
                          <button
                            onClick={() => onViewContract(req)}
                            className="text-[10px] font-black text-emerald-600 hover:underline cursor-pointer uppercase italic"
                          >
                            {req.status === "WAITING_CUSTOMER_SIGNATURE"
                              ? "📜 Ký hợp đồng"
                              : "📜 Hợp đồng"}
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ContractModal({ isOpen, onClose, contract, bookingStatus, showToast, onSuccess }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const canSignContract =
    contract && !contract.customerSigned && bookingStatus === "WAITING_CUSTOMER_SIGNATURE";

  const isWaitingAdminApproval =
    contract && !contract.customerSigned && bookingStatus === "WAITING_CONTRACT_APPROVAL";

  const getCanvasPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const { x, y } = getCanvasPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const { x, y } = getCanvasPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
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
    const hasInk = pixels.some((v, i) => i % 4 === 3 && v > 0);
    if (!hasInk) {
      showToast("Vui lòng ký tên trước khi xác nhận!", "warning");
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
      showToast("Xác nhận hợp đồng thành công!");
      onSuccess();
      onClose();
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.messages?.join?.(" ") ||
        "Lỗi xác nhận hợp đồng";
      showToast(msg, "error");
    }
  };

  if (!isOpen || !contract) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chi Tiết Hợp Đồng Sửa Chữa">
      <div className="space-y-4">
        <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
          <span>Mã: {contract.contractCode}</span>
          <span className={contract.customerSigned ? "text-emerald-600" : "text-amber-500"}>
            {contract.customerSigned
              ? "Đã ký"
              : bookingStatus === "WAITING_CONTRACT_APPROVAL"
              ? "Chờ Admin duyệt"
              : bookingStatus === "WAITING_CUSTOMER_SIGNATURE"
              ? "Mời bạn ký hợp đồng"
              : ""}
          </span>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap min-h-[160px] max-h-[280px] overflow-y-auto">
          {contract.content || "Chưa có nội dung"}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {contract.workerSignatureImg && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest px-1">
                Chữ ký Giám sát / Thợ
              </label>
              <div className="border border-blue-100 rounded-2xl bg-white p-4 flex justify-center shadow-inner">
                <img
                  src={contract.workerSignatureImg}
                  alt="Chữ ký thợ"
                  className="max-h-32 object-contain"
                />
              </div>
            </div>
          )}
          {contract.customerSigned && contract.customerSignatureImg && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest px-1">
                Chữ ký của bạn
              </label>
              <div className="border border-emerald-100 rounded-2xl p-4 bg-white flex justify-center shadow-inner">
                <img
                  src={contract.customerSignatureImg}
                  alt="Chữ ký khách"
                  className="max-h-32 object-contain"
                />
              </div>
            </div>
          )}
        </div>

        {isWaitingAdminApproval && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
            Hợp đồng đang chờ <strong>Admin duyệt</strong>. Bạn sẽ ký sau khi được duyệt.
          </div>
        )}

        {canSignContract && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                  Ký tên xác nhận tại đây
                </label>
                <button
                  type="button"
                  onClick={clearSignature}
                  className="text-[10px] text-rose-500 font-bold hover:underline"
                >
                  Xóa chữ ký
                </button>
              </div>
              <div className="border-2 border-dashed border-slate-200 rounded-2xl bg-white overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={500}
                  height={150}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={() => setIsDrawing(false)}
                  onMouseLeave={() => setIsDrawing(false)}
                  className="w-full cursor-crosshair touch-none"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleConfirm}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95"
            >
              Xác Nhận &amp; Ký Hợp Đồng
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

const DEFAULT_FORM = {
  selectedServiceId: "",
  selectedTechnicianId: "",
  newDesc: "",
  address: "",
  appointmentDate: new Date().toISOString().split("T")[0],
  appointmentTime: "08:00",
};

export default function CustomerBooking() {
  const navigate = useNavigate();
  const { user: profile, showToast } = useOutletContext();

  const [services, setServices] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setFormState] = useState(DEFAULT_FORM);
  const [editingBookingId, setEditingBookingId] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [contractModal, setContractModal] = useState({ open: false, contract: null, bookingStatus: null });
  const [confirmDialog, setConfirmDialog] = useState(null);

  const setForm = (key, value) => setFormState((prev) => ({ ...prev, [key]: value }));

  // ── Fetch data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoadingData(true);
      try {
        const [srvRes, staffRes, bookingRes] = await Promise.all([
          AxiosConfig.get("/services"),
          AxiosConfig.get("/staff"),
          AxiosConfig.get("/bookings/me"),
        ]);

        const srvList = srvRes.data || [];
        setServices(srvList);
        if (srvList.length > 0) setForm("selectedServiceId", srvList[0].id);

        const techList = (staffRes.data || []).filter(
          (s) => (s.available === true || s.available == null) && s.staffType !== "SUPERVISOR"
        );
        setTechnicians(techList);

        setBookings(Array.isArray(bookingRes.data) ? bookingRes.data : []);
      } catch (err) {
        console.error("Lỗi tải dữ liệu booking:", err);
        showToast("Không thể tải dữ liệu. Vui lòng thử lại!", "error");
      } finally {
        setLoadingData(false);
      }
    };
    load();
  }, [refreshTrigger]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleResetForm = () => {
    setEditingBookingId(null);
    setFormState({
      ...DEFAULT_FORM,
      selectedServiceId: services.length > 0 ? services[0].id : "",
      appointmentDate: new Date().toISOString().split("T")[0],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (profile?.status === "RESTRICTED") {
      showToast("Tài khoản đã bị khóa!", "error");
      return;
    }
    const { selectedServiceId, selectedTechnicianId, newDesc, address, appointmentDate, appointmentTime } = form;
    if (!newDesc.trim() || !address.trim() || !selectedServiceId || !appointmentDate || !appointmentTime) {
      showToast("Vui lòng nhập đủ thông tin!", "warning");
      return;
    }
    if (!profile?.id) {
      showToast("Dữ liệu chưa tải xong!", "warning");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        customerId: Number(profile.id),
        serviceId: Number(selectedServiceId),
        preferredTechnicianId: selectedTechnicianId ? Number(selectedTechnicianId) : null,
        appointmentDate,
        appointmentTime: formatTime(appointmentTime),
        address,
        description: newDesc,
        status: "PENDING",
      };

      if (editingBookingId) {
        await AxiosConfig.put(`/bookings/${editingBookingId}`, payload);
        showToast("Cập nhật yêu cầu thành công!");
      } else {
        await AxiosConfig.post("/bookings", payload);
        showToast("Gửi yêu cầu thành công!");
      }

      setRefreshTrigger((prev) => prev + 1);
      handleResetForm();
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        error.response?.data?.messages?.join(", ") ||
        "Không thể gửi yêu cầu. Vui lòng thử lại!";
      showToast("Lỗi: " + errorMsg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    setConfirmDialog({
      title: "Xóa yêu cầu",
      message: "Bạn có chắc chắn muốn xóa yêu cầu này?",
      onConfirm: async () => {
        try {
          await AxiosConfig.delete(`/bookings/${id}`);
          setBookings((prev) => prev.filter((b) => b.id !== id));
          if (editingBookingId === id) handleResetForm();
          showToast("Đã xóa yêu cầu thành công!");
        } catch {
          showToast("Không thể xóa yêu cầu!", "error");
        } finally {
          setConfirmDialog(null);
        }
      },
    });
  };

  const handleEdit = (req) => {
    setEditingBookingId(req.id);
    setFormState({
      selectedServiceId: req.serviceId,
      selectedTechnicianId: req.preferredTechnicianId || req.technicianId || "",
      newDesc: req.description || "",
      address: req.address || "",
      appointmentDate: formatDate(req.appointmentDate) || "",
      appointmentTime: (req.appointmentTime || "").toString().slice(0, 5) || "08:00",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCustomerAccept = (bookingId) => {
    setConfirmDialog({
      title: "Nghiệm thu công trình",
      message: "Xác nhận nghiệm thu công trình?\nChỉ khi cả Giám sát cũng xác nhận thì đơn mới hoàn tất.",
      onConfirm: async () => {
        try {
          const detailsRes = await AxiosConfig.get(`/booking-details/booking/${bookingId}`);
          const details = Array.isArray(detailsRes.data) ? detailsRes.data : [];
          if (!details.length) throw new Error("Đơn hàng chưa có hạng mục để nghiệm thu");
          await Promise.all(
            details
              .filter((d) => !d.customerAccepted)
              .map((d) => AxiosConfig.post(`/booking-details/${d.id}/customer-accept`))
          );
          showToast("Đã xác nhận nghiệm thu thành công!");
          setRefreshTrigger((prev) => prev + 1);
        } catch (error) {
          showToast(error.response?.data?.message || "Không thể xác nhận nghiệm thu", "error");
        } finally {
          setConfirmDialog(null);
        }
      },
    });
  };

  const handleViewContract = async (booking) => {
    try {
      const res = await AxiosConfig.get("/contracts");
      const list = Array.isArray(res.data) ? res.data : [];
      const contract = list.find((c) => Number(c.bookingId) === Number(booking.id));
      if (contract) {
        setContractModal({ open: true, contract, bookingStatus: booking.status });
      } else {
        showToast(
          ["WAITING_CONTRACT_APPROVAL", "CONTRACT_APPROVED"].includes(booking.status)
            ? "Chưa tìm thấy hợp đồng. Vui lòng thử lại sau."
            : "Chưa có hợp đồng cho yêu cầu này.",
          "info"
        );
      }
    } catch {
      showToast("Lỗi tải thông tin hợp đồng", "error");
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loadingData) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Đặt lịch khảo sát</h1>
        <p className="text-sm text-slate-500 mt-1">
          Tạo yêu cầu mới hoặc theo dõi tiến độ công trình hiện tại.
        </p>
      </div>

      {profile?.status === "RESTRICTED" && (
        <div className="p-5 bg-rose-50 border-l-4 border-rose-500 rounded-2xl flex items-center gap-4">
          <span className="text-3xl">🚫</span>
          <div>
            <h4 className="text-rose-800 font-black text-base">
              Tài khoản của bạn hiện đang bị khóa
            </h4>
            <p className="text-rose-600 text-sm font-medium">
              Bạn không thể gửi yêu cầu mới. Vui lòng liên hệ tổng đài hỗ trợ.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <BookingForm
          services={services}
          technicians={technicians}
          profile={profile}
          editingBookingId={editingBookingId}
          formState={form}
          setForm={setForm}
          onSubmit={handleSubmit}
          onReset={handleResetForm}
          loading={submitting}
        />
        <div className="lg:col-span-2">
          <BookingTable
            bookings={bookings}
            services={services}
            technicians={technicians}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAccept={handleCustomerAccept}
            onViewContract={handleViewContract}
            navigate={navigate}
          />
        </div>
      </div>

      <ContractModal
        isOpen={contractModal.open}
        onClose={() => setContractModal({ open: false, contract: null, bookingStatus: null })}
        contract={contractModal.contract}
        bookingStatus={contractModal.bookingStatus}
        showToast={showToast}
        onSuccess={() => setRefreshTrigger((prev) => prev + 1)}
      />

      <ConfirmDialog
        isOpen={Boolean(confirmDialog)}
        onClose={() => setConfirmDialog(null)}
        onConfirm={() => confirmDialog?.onConfirm?.()}
        title={confirmDialog?.title}
        message={confirmDialog?.message}
      />
    </div>
  );
}
