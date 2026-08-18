// import { useState, useEffect, useRef } from "react";
// import { useNavigate, useOutletContext } from "react-router-dom";
// import AxiosConfig from "../../util/AxiosConfig";
// import StatusBadge from "../../components/common/StatusBadge";
// import Modal from "../../components/common/Modal";
// import ConfirmDialog from "../../components/common/ConfirmDialog";
// import LoadingSpinner from "../../components/common/LoadingSpinner";

// function formatDate(dateInput) {
//     if (Array.isArray(dateInput)) {
//         const [year, month, day] = dateInput;
//         return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
//     }
//     return dateInput || "";
// }

// // ─── Contract Modal (giữ nguyên logic ký) ────────────────────────────────────

// function ContractModal({ isOpen, onClose, contract, bookingStatus, showToast, onSuccess }) {
//     const canvasRef = useRef(null);
//     const [isDrawing, setIsDrawing] = useState(false);

//     const canSignContract =
//         contract && !contract.customerSigned && bookingStatus === "WAITING_CUSTOMER_SIGNATURE";

//     const isWaitingAdminApproval =
//         contract && !contract.customerSigned && bookingStatus === "WAITING_CONTRACT_APPROVAL";

//     const getCanvasPos = (e) => {
//         const canvas = canvasRef.current;
//         const rect = canvas.getBoundingClientRect();
//         const scaleX = canvas.width / rect.width;
//         const scaleY = canvas.height / rect.height;
//         return {
//             x: (e.clientX - rect.left) * scaleX,
//             y: (e.clientY - rect.top) * scaleY,
//         };
//     };

//     const startDrawing = (e) => {
//         const canvas = canvasRef.current;
//         if (!canvas) return;
//         const ctx = canvas.getContext("2d");
//         ctx.strokeStyle = "#0f172a";
//         ctx.lineWidth = 2;
//         ctx.lineCap = "round";
//         ctx.lineJoin = "round";
//         const { x, y } = getCanvasPos(e);
//         ctx.beginPath();
//         ctx.moveTo(x, y);
//         setIsDrawing(true);
//     };

//     const draw = (e) => {
//         if (!isDrawing) return;
//         const canvas = canvasRef.current;
//         if (!canvas) return;
//         const ctx = canvas.getContext("2d");
//         const { x, y } = getCanvasPos(e);
//         ctx.lineTo(x, y);
//         ctx.stroke();
//     };

//     const clearSignature = () => {
//         const canvas = canvasRef.current;
//         if (!canvas) return;
//         const ctx = canvas.getContext("2d");
//         ctx.clearRect(0, 0, canvas.width, canvas.height);
//     };

//     const handleConfirm = async () => {
//         const canvas = canvasRef.current;
//         if (!canvas || !contract?.id) return;
//         const ctx = canvas.getContext("2d");
//         const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
//         const hasInk = pixels.some((v, i) => i % 4 === 3 && v > 0);
//         if (!hasInk) {
//             showToast("Vui lòng ký tên trước khi xác nhận!", "warning");
//             return;
//         }
//         const signatureBase64 = canvas.toDataURL("image/png");
//         try {
//             const payload = {
//                 id: contract.id,
//                 bookingId: contract.bookingId,
//                 contractCode: contract.contractCode,
//                 content: contract.content,
//                 customerSigned: true,
//                 customerSignatureImg: signatureBase64,
//                 workerSigned: contract.workerSigned ?? false,
//                 workerSignatureImg: contract.workerSignatureImg ?? null,
//             };
//             await AxiosConfig.put(`/contracts/${contract.id}`, payload);
//             showToast("Xác nhận hợp đồng thành công!");
//             onSuccess();
//             onClose();
//         } catch (error) {
//             const msg =
//                 error.response?.data?.message ||
//                 error.response?.data?.messages?.join?.(" ") ||
//                 "Lỗi xác nhận hợp đồng";
//             showToast(msg, "error");
//         }
//     };

//     if (!isOpen || !contract) return null;

//     return (
//         <Modal isOpen={isOpen} onClose={onClose} title="Chi Tiết Hợp Đồng Sửa Chữa">
//             <div className="space-y-4">
//                 <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
//                     <span>Mã: {contract.contractCode}</span>
//                     <span className={contract.customerSigned ? "text-emerald-600" : "text-amber-500"}>
//                         {contract.customerSigned
//                             ? "Đã ký"
//                             : bookingStatus === "WAITING_CONTRACT_APPROVAL"
//                                 ? "Chờ Admin duyệt"
//                                 : bookingStatus === "WAITING_CUSTOMER_SIGNATURE"
//                                     ? "Mời bạn ký hợp đồng"
//                                     : ""}
//                     </span>
//                 </div>

//                 <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap min-h-[160px] max-h-[280px] overflow-y-auto">
//                     {contract.content || "Chưa có nội dung"}
//                 </div>

//                 <div className="grid grid-cols-2 gap-4">
//                     {contract.workerSignatureImg && (
//                         <div className="space-y-2">
//                             <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest px-1">
//                                 Chữ ký Giám sát / Thợ
//                             </label>
//                             <div className="border border-blue-100 rounded-2xl bg-white p-4 flex justify-center shadow-inner">
//                                 <img
//                                     src={contract.workerSignatureImg}
//                                     alt="Chữ ký thợ"
//                                     className="max-h-32 object-contain"
//                                 />
//                             </div>
//                         </div>
//                     )}
//                     {contract.customerSigned && contract.customerSignatureImg && (
//                         <div className="space-y-2">
//                             <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest px-1">
//                                 Chữ ký của bạn
//                             </label>
//                             <div className="border border-emerald-100 rounded-2xl p-4 bg-white flex justify-center shadow-inner">
//                                 <img
//                                     src={contract.customerSignatureImg}
//                                     alt="Chữ ký khách"
//                                     className="max-h-32 object-contain"
//                                 />
//                             </div>
//                         </div>
//                     )}
//                 </div>

//                 {isWaitingAdminApproval && (
//                     <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
//                         Hợp đồng đang chờ <strong>Admin duyệt</strong>. Bạn sẽ ký sau khi được duyệt.
//                     </div>
//                 )}

//                 {canSignContract && (
//                     <div className="space-y-4">
//                         <div className="space-y-2">
//                             <div className="flex justify-between items-end">
//                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
//                                     Ký tên xác nhận tại đây
//                                 </label>
//                                 <button
//                                     type="button"
//                                     onClick={clearSignature}
//                                     className="text-[10px] text-rose-500 font-bold hover:underline"
//                                 >
//                                     Xóa chữ ký
//                                 </button>
//                             </div>
//                             <div className="border-2 border-dashed border-slate-200 rounded-2xl bg-white overflow-hidden">
//                                 <canvas
//                                     ref={canvasRef}
//                                     width={500}
//                                     height={150}
//                                     onMouseDown={startDrawing}
//                                     onMouseMove={draw}
//                                     onMouseUp={() => setIsDrawing(false)}
//                                     onMouseLeave={() => setIsDrawing(false)}
//                                     className="w-full cursor-crosshair touch-none"
//                                 />
//                             </div>
//                         </div>
//                         <button
//                             type="button"
//                             onClick={handleConfirm}
//                             className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95"
//                         >
//                             Xác Nhận &amp; Ký Hợp Đồng
//                         </button>
//                     </div>
//                 )}
//             </div>
//         </Modal>
//     );
// }

// // ─── Main: Yêu cầu đang làm ───────────────────────────────────────────────────

// export default function OngoingBookings() {
//     const navigate = useNavigate();
//     const { showToast } = useOutletContext();

//     const [bookings, setBookings] = useState([]);
//     const [services, setServices] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [refreshTrigger, setRefreshTrigger] = useState(0);

//     const [searchTerm, setSearchTerm] = useState("");
//     const [startDate, setStartDate] = useState("");
//     const [endDate, setEndDate] = useState("");
//     const [sortOrder, setSortOrder] = useState("desc");

//     const [contractModal, setContractModal] = useState({
//         open: false,
//         contract: null,
//         bookingStatus: null,
//     });
//     const [confirmDialog, setConfirmDialog] = useState(null);

//     useEffect(() => {
//         const load = async () => {
//             setLoading(true);
//             try {
//                 const [srvRes, bookingRes] = await Promise.all([
//                     AxiosConfig.get("/services"),
//                     AxiosConfig.get("/bookings/me"),
//                 ]);
//                 setServices(srvRes.data || []);
//                 // Chỉ lấy các booking chưa hoàn tất
//                 const all = Array.isArray(bookingRes.data) ? bookingRes.data : [];
//                 const ongoing = all.filter((b) => b.status !== "COMPLETED" && b.status !== "CANCELLED");
//                 setBookings(ongoing);
//             } catch (err) {
//                 console.error(err);
//                 showToast("Không thể tải dữ liệu!", "error");
//             } finally {
//                 setLoading(false);
//             }
//         };
//         load();
//     }, [refreshTrigger]);

//     const filtered = bookings
//         .filter((req) => {
//             const srvName = services.find((s) => s.id === req.serviceId)?.name || "";
//             const matchesName =
//                 !searchTerm ||
//                 srvName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                 (req.description || "").toLowerCase().includes(searchTerm.toLowerCase());
//             const reqDate = formatDate(req.appointmentDate);
//             const matchesStart = !startDate || reqDate >= startDate;
//             const matchesEnd = !endDate || reqDate <= endDate;
//             return matchesName && matchesStart && matchesEnd;
//         })
//         .sort((a, b) => {
//             const dateA = formatDate(a.appointmentDate);
//             const dateB = formatDate(b.appointmentDate);
//             return sortOrder === "desc"
//                 ? dateB.localeCompare(dateA)
//                 : dateA.localeCompare(dateB);
//         });

//     const handleDelete = (id) => {
//         setConfirmDialog({
//             title: "Xóa yêu cầu",
//             message: "Bạn có chắc chắn muốn xóa yêu cầu này?",
//             onConfirm: async () => {
//                 try {
//                     await AxiosConfig.delete(`/bookings/${id}`);
//                     setBookings((prev) => prev.filter((b) => b.id !== id));
//                     showToast("Đã xóa yêu cầu thành công!");
//                 } catch {
//                     showToast("Không thể xóa yêu cầu!", "error");
//                 } finally {
//                     setConfirmDialog(null);
//                 }
//             },
//         });
//     };

//     const handleCustomerAccept = (bookingId) => {
//         setConfirmDialog({
//             title: "Nghiệm thu công trình",
//             message:
//                 "Xác nhận nghiệm thu công trình?\nChỉ khi cả Giám sát cũng xác nhận thì đơn mới hoàn tất.",
//             onConfirm: async () => {
//                 try {
//                     const detailsRes = await AxiosConfig.get(
//                         `/booking-details/booking/${bookingId}`
//                     );
//                     const details = Array.isArray(detailsRes.data) ? detailsRes.data : [];
//                     if (!details.length)
//                         throw new Error("Đơn hàng chưa có hạng mục để nghiệm thu");
//                     await Promise.all(
//                         details
//                             .filter((d) => !d.customerAccepted)
//                             .map((d) =>
//                                 AxiosConfig.post(`/booking-details/${d.id}/customer-accept`)
//                             )
//                     );
//                     showToast("Đã xác nhận nghiệm thu thành công!");
//                     setRefreshTrigger((prev) => prev + 1);
//                 } catch (error) {
//                     showToast(
//                         error.response?.data?.message || "Không thể xác nhận nghiệm thu",
//                         "error"
//                     );
//                 } finally {
//                     setConfirmDialog(null);
//                 }
//             },
//         });
//     };

//     const handleViewContract = async (booking) => {
//         try {
//             const res = await AxiosConfig.get("/contracts");
//             const list = Array.isArray(res.data) ? res.data : [];
//             const contract = list.find(
//                 (c) => Number(c.bookingId) === Number(booking.id)
//             );
//             if (contract) {
//                 setContractModal({
//                     open: true,
//                     contract,
//                     bookingStatus: booking.status,
//                 });
//             } else {
//                 showToast(
//                     ["WAITING_CONTRACT_APPROVAL", "CONTRACT_APPROVED"].includes(
//                         booking.status
//                     )
//                         ? "Chưa tìm thấy hợp đồng. Vui lòng thử lại sau."
//                         : "Chưa có hợp đồng cho yêu cầu này.",
//                     "info"
//                 );
//             }
//         } catch {
//             showToast("Lỗi tải thông tin hợp đồng", "error");
//         }
//     };

//     if (loading) return <LoadingSpinner />;

//     return (
//         <div className="space-y-6">
//             <div>
//                 <h1 className="text-2xl font-bold text-slate-800">Yêu cầu đang làm</h1>
//                 <p className="text-sm text-slate-500 mt-1">
//                     Theo dõi tiến độ các công trình đang xử lý.
//                 </p>
//             </div>

//             <div className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
//                 {/* Filters */}
//                 <div className="mb-4 flex flex-wrap gap-2 items-center">
//                     <div className="flex-1 min-w-[150px] relative">
//                         <input
//                             type="text"
//                             placeholder="Tìm theo hạng mục, mô tả..."
//                             className="w-full pl-8 pr-4 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
//                             value={searchTerm}
//                             onChange={(e) => setSearchTerm(e.target.value)}
//                         />
//                         <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px]">
//                             🔍
//                         </span>
//                     </div>
//                     <input
//                         type="date"
//                         className="px-2 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px]"
//                         value={startDate}
//                         onChange={(e) => setStartDate(e.target.value)}
//                     />
//                     <span className="text-[10px] text-slate-400">→</span>
//                     <input
//                         type="date"
//                         className="px-2 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px]"
//                         value={endDate}
//                         onChange={(e) => setEndDate(e.target.value)}
//                     />
//                     <select
//                         className="px-2 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px]"
//                         value={sortOrder}
//                         onChange={(e) => setSortOrder(e.target.value)}
//                     >
//                         <option value="desc">Mới nhất</option>
//                         <option value="asc">Cũ nhất</option>
//                     </select>
//                 </div>

//                 {filtered.length === 0 ? (
//                     <div className="py-16 text-center text-slate-400 text-sm">
//                         <div className="text-4xl mb-3">📋</div>
//                         <p className="font-semibold">Chưa có yêu cầu đang xử lý</p>
//                         <p className="text-xs mt-1">
//                             Tạo yêu cầu mới tại mục <strong>Tạo yêu cầu</strong>.
//                         </p>
//                     </div>
//                 ) : (
//                     <div className="overflow-x-auto">
//                         <table className="w-full text-left border-collapse">
//                             <thead>
//                                 <tr className="border-b border-slate-100 text-slate-400 text-xs font-bold tracking-wide uppercase">
//                                     <th className="pb-3 pl-2">Mã</th>
//                                     <th className="pb-3">Thời gian / Nhân sự</th>
//                                     <th className="pb-3">Địa chỉ &amp; Mô tả</th>
//                                     <th className="pb-3 pr-2 text-right">Trạng thái &amp; Thao tác</th>
//                                 </tr>
//                             </thead>
//                             <tbody className="divide-y divide-slate-100/70">
//                                 {filtered.map((req) => (
//                                     <tr
//                                         key={req.id}
//                                         className="text-sm text-slate-600 hover:bg-slate-50/40 transition-colors"
//                                     >
//                                         <td className="py-4 pl-2 font-bold text-blue-600">
//                                             #{req.id}
//                                         </td>
//                                         <td className="py-4 font-semibold text-slate-800">
//                                             <div className="flex flex-col">
//                                                 <span>
//                                                     {formatDate(req.appointmentDate)} |{" "}
//                                                     {req.appointmentTime}
//                                                 </span>
//                                                 <span className="text-[10px] text-blue-500 font-bold uppercase tracking-tight">
//                                                     {req.preferredTechnicianName ||
//                                                         req.technicianName ||
//                                                         "Đang chờ phân công"}
//                                                 </span>
//                                             </div>
//                                         </td>
//                                         <td
//                                             className="py-4 max-w-[260px] truncate text-slate-500"
//                                             title={`${req.address} - ${req.description}`}
//                                         >
//                                             <span className="font-bold text-slate-700">
//                                                 {req.address}
//                                             </span>
//                                             : {req.description}
//                                         </td>
//                                         <td className="py-4 pr-2 text-right">
//                                             <div className="flex flex-col items-end gap-2">
//                                                 <StatusBadge status={req.status} />
//                                                 <div className="flex gap-3 flex-wrap justify-end">
//                                                     <button
//                                                         onClick={() =>
//                                                             navigate(`/customer/bookings/${req.id}`)
//                                                         }
//                                                         className="text-[10px] font-black text-blue-600 hover:underline cursor-pointer uppercase"
//                                                     >
//                                                         Xem chi tiết
//                                                     </button>

//                                                     {req.status === "PENDING" && (
//                                                         <button
//                                                             onClick={() => handleDelete(req.id)}
//                                                             className="text-[10px] font-black text-rose-600 hover:underline cursor-pointer uppercase"
//                                                         >
//                                                             Xóa
//                                                         </button>
//                                                     )}

//                                                     {req.status === "WORKER_COMPLETED" &&
//                                                         !req.customerAccepted && (
//                                                             <button
//                                                                 onClick={() => handleCustomerAccept(req.id)}
//                                                                 className="text-[10px] font-black text-purple-600 hover:underline cursor-pointer uppercase"
//                                                             >
//                                                                 Nghiệm thu
//                                                             </button>
//                                                         )}

//                                                     {req.status === "WORKER_COMPLETED" &&
//                                                         req.customerAccepted && (
//                                                             <span className="text-[10px] font-bold text-emerald-600 uppercase">
//                                                                 Đã nghiệm thu ✓
//                                                             </span>
//                                                         )}

//                                                     {[
//                                                         "WAITING_CONTRACT_APPROVAL",
//                                                         "WAITING_CUSTOMER_SIGNATURE",
//                                                         "ASSIGNED",
//                                                         "PROCESSING",
//                                                         "WORKER_COMPLETED",
//                                                         "COMPLETED",
//                                                     ].includes(req.status) && (
//                                                             <button
//                                                                 onClick={() => handleViewContract(req)}
//                                                                 className="text-[10px] font-black text-emerald-600 hover:underline cursor-pointer uppercase italic"
//                                                             >
//                                                                 {req.status === "WAITING_CUSTOMER_SIGNATURE"
//                                                                     ? "📜 Ký hợp đồng"
//                                                                     : "📜 Hợp đồng"}
//                                                             </button>
//                                                         )}
//                                                 </div>
//                                             </div>
//                                         </td>
//                                     </tr>
//                                 ))}
//                             </tbody>
//                         </table>
//                     </div>
//                 )}
//             </div>

//             <ContractModal
//                 isOpen={contractModal.open}
//                 onClose={() =>
//                     setContractModal({ open: false, contract: null, bookingStatus: null })
//                 }
//                 contract={contractModal.contract}
//                 bookingStatus={contractModal.bookingStatus}
//                 showToast={showToast}
//                 onSuccess={() => setRefreshTrigger((prev) => prev + 1)}
//             />

//             <ConfirmDialog
//                 isOpen={Boolean(confirmDialog)}
//                 onClose={() => setConfirmDialog(null)}
//                 onConfirm={() => confirmDialog?.onConfirm?.()}
//                 title={confirmDialog?.title}
//                 message={confirmDialog?.message}
//             />
//         </div>
//     );
// }


import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import AxiosConfig from "../../util/AxiosConfig";
import StatusBadge from "../../components/common/StatusBadge";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import LoadingSpinner from "../../components/common/LoadingSpinner";

function formatDate(dateInput) {
    if (Array.isArray(dateInput)) {
        const [year, month, day] = dateInput;

        return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
            2,
            "0"
        )}`;
    }

    if (!dateInput) return "—";

    return String(dateInput).split("T")[0];
}

function formatDateTime(dateInput) {
    if (!dateInput) return 0;

    if (Array.isArray(dateInput)) {
        const [year, month = 1, day = 1] = dateInput;

        return new Date(year, month - 1, day).getTime();
    }

    const time = new Date(dateInput).getTime();

    return Number.isNaN(time) ? 0 : time;
}

function getBookingCreatedTime(booking) {
    const created = formatDateTime(booking.createdAt);

    if (created > 0) return created;

    const appointment = formatDateTime(booking.appointmentDate);

    if (appointment > 0) return appointment;

    return Number(booking.id) || 0;
}

export default function OngoingBookings() {
    const navigate = useNavigate();
    const { showToast } = useOutletContext();

    const [bookings, setBookings] = useState([]);
    const [services, setServices] = useState([]);

    const [loading, setLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const [searchTerm, setSearchTerm] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [confirmDialog, setConfirmDialog] = useState(null);

    const loadBookings = async () => {
        setLoading(true);

        try {
            const [serviceResponse, bookingResponse] = await Promise.all([
                AxiosConfig.get("/services"),
                AxiosConfig.get("/bookings/me"),
            ]);

            const serviceData = Array.isArray(serviceResponse.data)
                ? serviceResponse.data
                : [];

            const bookingData = Array.isArray(bookingResponse.data)
                ? bookingResponse.data
                : [];

            const ongoing = bookingData.filter(
                (booking) =>
                    booking.status !== "COMPLETED" &&
                    booking.status !== "CANCELLED"
            );

            setServices(serviceData);
            setBookings(ongoing);
        } catch (error) {
            console.error("Load ongoing bookings error:", error);
            showToast("Không thể tải danh sách yêu cầu!", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBookings();
    }, [refreshTrigger]);

    const serviceMap = useMemo(() => {
        return new Map(services.map((service) => [service.id, service]));
    }, [services]);

    const filteredBookings = useMemo(() => {
        const keyword = searchTerm.trim().toLowerCase();

        return [...bookings]
            .filter((booking) => {
                const serviceName =
                    serviceMap.get(booking.serviceId)?.name ||
                    booking.serviceName ||
                    booking.service?.name ||
                    "";

                const searchableText = [
                    serviceName,
                    booking.description,
                    booking.address,
                    booking.technicianName,
                    booking.preferredTechnicianName,
                    booking.id,
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

                const matchesSearch =
                    !keyword || searchableText.includes(keyword);

                const appointmentDate = formatDate(booking.appointmentDate);

                const matchesStart =
                    !startDate || appointmentDate >= startDate;

                const matchesEnd =
                    !endDate || appointmentDate <= endDate;

                return matchesSearch && matchesStart && matchesEnd;
            })
            .sort((a, b) => {
                /*
                 * Đơn mới tạo gần nhất luôn đứng đầu.
                 * Nếu backend không trả createdAt thì fallback:
                 * appointmentDate -> id
                 */
                return getBookingCreatedTime(b) - getBookingCreatedTime(a);
            });
    }, [bookings, serviceMap, searchTerm, startDate, endDate]);

    const handleDelete = (bookingId) => {
        setConfirmDialog({
            title: "Xóa yêu cầu",
            message:
                "Bạn có chắc chắn muốn xóa yêu cầu này? Thao tác này không thể hoàn tác.",
            onConfirm: async () => {
                try {
                    await AxiosConfig.delete(`/bookings/${bookingId}`);

                    setBookings((prev) =>
                        prev.filter((booking) => booking.id !== bookingId)
                    );

                    showToast("Đã xóa yêu cầu thành công!");
                } catch (error) {
                    console.error("Delete booking error:", error);

                    showToast(
                        error.response?.data?.message ||
                        "Không thể xóa yêu cầu!",
                        "error"
                    );
                } finally {
                    setConfirmDialog(null);
                }
            },
        });
    };

    const handleCustomerAccept = (bookingId) => {
        setConfirmDialog({
            title: "Nghiệm thu công trình",
            message:
                "Xác nhận nghiệm thu công trình?\n\nSau khi xác nhận, hệ thống sẽ ghi nhận bạn đã nghiệm thu. Đơn chỉ hoàn tất khi phía nhân sự cũng xác nhận.",
            onConfirm: async () => {
                try {
                    const response = await AxiosConfig.get(
                        `/booking-details/booking/${bookingId}`
                    );

                    const details = Array.isArray(response.data)
                        ? response.data
                        : [];

                    if (!details.length) {
                        throw new Error(
                            "Đơn hàng chưa có hạng mục để nghiệm thu"
                        );
                    }

                    const pendingDetails = details.filter(
                        (detail) => !detail.customerAccepted
                    );

                    if (!pendingDetails.length) {
                        showToast("Các hạng mục đã được nghiệm thu!", "info");
                        return;
                    }

                    await Promise.all(
                        pendingDetails.map((detail) =>
                            AxiosConfig.post(
                                `/booking-details/${detail.id}/customer-accept`
                            )
                        )
                    );

                    showToast("Đã xác nhận nghiệm thu thành công!");

                    setRefreshTrigger((prev) => prev + 1);
                } catch (error) {
                    console.error("Customer accept error:", error);

                    showToast(
                        error.response?.data?.message ||
                        error.message ||
                        "Không thể xác nhận nghiệm thu!",
                        "error"
                    );
                } finally {
                    setConfirmDialog(null);
                }
            },
        });
    };

    const getServiceName = (booking) => {
        return (
            serviceMap.get(booking.serviceId)?.name ||
            booking.serviceName ||
            booking.service?.name ||
            "Dịch vụ sửa chữa"
        );
    };

    const getTechnicianName = (booking) => {
        return (
            booking.technicianName ||
            booking.preferredTechnicianName ||
            "Đang chờ phân công"
        );
    };

    const clearFilters = () => {
        setSearchTerm("");
        setStartDate("");
        setEndDate("");
    };

    const hasFilter = searchTerm || startDate || endDate;

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h1 className="text-2xl font-black text-slate-900">
                            Yêu cầu đang xử lý
                        </h1>

                        <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-black">
                            {filteredBookings.length}
                        </span>
                    </div>

                    <p className="text-sm text-slate-500">
                        Theo dõi các công trình từ lúc tiếp nhận đến khi hoàn thành.
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                <div className="p-4">
                    <div className="flex flex-col lg:flex-row gap-3">
                        {/* Search */}
                        <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                🔍
                            </span>

                            <input
                                type="text"
                                placeholder="Tìm mã đơn, dịch vụ, địa chỉ, mô tả..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="
                  w-full pl-9 pr-4 py-2.5
                  bg-slate-50
                  border border-slate-200
                  rounded-xl
                  text-sm
                  outline-none
                  transition
                  focus:bg-white
                  focus:border-blue-400
                  focus:ring-4
                  focus:ring-blue-500/10
                "
                            />
                        </div>

                        {/* Date */}
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="
                  px-3 py-2.5
                  bg-slate-50
                  border border-slate-200
                  rounded-xl
                  text-sm
                  outline-none
                  focus:bg-white
                  focus:border-blue-400
                "
                            />

                            <span className="text-slate-400">→</span>

                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="
                  px-3 py-2.5
                  bg-slate-50
                  border border-slate-200
                  rounded-xl
                  text-sm
                  outline-none
                  focus:bg-white
                  focus:border-blue-400
                "
                            />

                            {hasFilter && (
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="
                    px-3 py-2.5
                    rounded-xl
                    text-xs
                    font-bold
                    text-slate-500
                    bg-slate-100
                    hover:bg-slate-200
                    whitespace-nowrap
                  "
                                >
                                    Xóa lọc
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Result count */}
                <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50">
                    <span className="text-xs text-slate-500">
                        Hiển thị{" "}
                        <strong className="text-slate-700">
                            {filteredBookings.length}
                        </strong>{" "}
                        / {bookings.length} yêu cầu
                    </span>
                </div>
            </div>

            {/* Empty */}
            {filteredBookings.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <div className="py-16 px-6 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl">
                            📋
                        </div>

                        <h3 className="font-bold text-slate-800">
                            {hasFilter
                                ? "Không tìm thấy yêu cầu phù hợp"
                                : "Chưa có yêu cầu đang xử lý"}
                        </h3>

                        <p className="text-sm text-slate-400 mt-1">
                            {hasFilter
                                ? "Hãy thử thay đổi điều kiện tìm kiếm."
                                : "Các yêu cầu mới sẽ xuất hiện tại đây."}
                        </p>

                        {hasFilter && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="
                  mt-4 px-4 py-2
                  rounded-xl
                  bg-blue-600
                  text-white
                  text-sm
                  font-bold
                  hover:bg-blue-700
                "
                            >
                                Xóa bộ lọc
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <>
                    {/* Desktop */}
                    <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="px-5 py-3 text-left text-[11px] font-black uppercase tracking-wider text-slate-400">
                                            Yêu cầu
                                        </th>

                                        <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-wider text-slate-400">
                                            Lịch hẹn
                                        </th>

                                        <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-wider text-slate-400">
                                            Công trình
                                        </th>

                                        <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-wider text-slate-400">
                                            Nhân sự
                                        </th>

                                        <th className="px-4 py-3 text-center text-[11px] font-black uppercase tracking-wider text-slate-400">
                                            Trạng thái
                                        </th>

                                        <th className="px-5 py-3 text-right text-[11px] font-black uppercase tracking-wider text-slate-400">
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">
                                    {filteredBookings.map((booking) => {
                                        const serviceName = getServiceName(booking);
                                        const technicianName =
                                            getTechnicianName(booking);

                                        return (
                                            <tr
                                                key={booking.id}
                                                className="hover:bg-slate-50/70 transition-colors"
                                            >
                                                {/* ID */}
                                                <td className="px-5 py-4">
                                                    <div className="font-black text-blue-600">
                                                        #{booking.id}
                                                    </div>

                                                    <div className="text-[11px] text-slate-400 mt-1">
                                                        {booking.createdAt
                                                            ? `Tạo ${formatDate(
                                                                booking.createdAt
                                                            )}`
                                                            : "Yêu cầu"}
                                                    </div>
                                                </td>

                                                {/* Appointment */}
                                                <td className="px-4 py-4">
                                                    <div className="font-bold text-slate-800 text-sm">
                                                        {formatDate(
                                                            booking.appointmentDate
                                                        )}
                                                    </div>

                                                    <div className="text-xs text-slate-500 mt-1">
                                                        🕐 {booking.appointmentTime || "Chưa xác định"}
                                                    </div>
                                                </td>

                                                {/* Construction */}
                                                <td className="px-4 py-4 max-w-[280px]">
                                                    <div
                                                        className="font-bold text-slate-800 truncate"
                                                        title={serviceName}
                                                    >
                                                        {serviceName}
                                                    </div>

                                                    <div
                                                        className="text-xs text-slate-500 mt-1 truncate"
                                                        title={booking.address}
                                                    >
                                                        {booking.address || "Chưa có địa chỉ"}
                                                    </div>
                                                </td>

                                                {/* Technician */}
                                                <td className="px-4 py-4">
                                                    <div
                                                        className={`text-sm font-semibold ${technicianName ===
                                                                "Đang chờ phân công"
                                                                ? "text-amber-500"
                                                                : "text-blue-600"
                                                            }`}
                                                    >
                                                        {technicianName}
                                                    </div>
                                                </td>

                                                {/* Status */}
                                                <td className="px-4 py-4 text-center">
                                                    <StatusBadge status={booking.status} />

                                                    {booking.status ===
                                                        "WORKER_COMPLETED" &&
                                                        booking.customerAccepted && (
                                                            <div className="mt-1 text-[10px] font-bold text-emerald-600">
                                                                Đã nghiệm thu ✓
                                                            </div>
                                                        )}
                                                </td>

                                                {/* Actions */}
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                navigate(
                                                                    `/customer/bookings/${booking.id}`
                                                                )
                                                            }
                                                            className="
                                px-3 py-2
                                rounded-lg
                                bg-blue-50
                                text-blue-600
                                text-xs
                                font-black
                                hover:bg-blue-100
                                transition
                              "
                                                        >
                                                            Xem chi tiết
                                                        </button>

                                                        {booking.status === "PENDING" && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleDelete(booking.id)
                                                                }
                                                                className="
                                  px-3 py-2
                                  rounded-lg
                                  text-rose-600
                                  bg-rose-50
                                  text-xs
                                  font-bold
                                  hover:bg-rose-100
                                "
                                                            >
                                                                Xóa
                                                            </button>
                                                        )}

                                                        {booking.status ===
                                                            "WORKER_COMPLETED" &&
                                                            !booking.customerAccepted && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleCustomerAccept(
                                                                            booking.id
                                                                        )
                                                                    }
                                                                    className="
                                    px-3 py-2
                                    rounded-lg
                                    bg-purple-50
                                    text-purple-600
                                    text-xs
                                    font-bold
                                    hover:bg-purple-100
                                  "
                                                                >
                                                                    Nghiệm thu
                                                                </button>
                                                            )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mobile */}
                    <div className="lg:hidden space-y-3">
                        {filteredBookings.map((booking) => {
                            const serviceName = getServiceName(booking);
                            const technicianName =
                                getTechnicianName(booking);

                            return (
                                <div
                                    key={booking.id}
                                    className="
                    bg-white
                    rounded-2xl
                    border border-slate-200
                    shadow-sm
                    p-4
                  "
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="text-xs font-black text-blue-600">
                                                #{booking.id}
                                            </div>

                                            <h3 className="font-bold text-slate-800 mt-1">
                                                {serviceName}
                                            </h3>
                                        </div>

                                        <StatusBadge status={booking.status} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                                        <div className="p-3 bg-slate-50 rounded-xl">
                                            <div className="text-slate-400 mb-1">
                                                Ngày hẹn
                                            </div>

                                            <div className="font-bold text-slate-700">
                                                {formatDate(booking.appointmentDate)}
                                            </div>

                                            <div className="text-slate-500 mt-1">
                                                {booking.appointmentTime || "—"}
                                            </div>
                                        </div>

                                        <div className="p-3 bg-slate-50 rounded-xl">
                                            <div className="text-slate-400 mb-1">
                                                Nhân sự
                                            </div>

                                            <div className="font-bold text-blue-600">
                                                {technicianName}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-3 p-3 bg-slate-50 rounded-xl">
                                        <div className="text-[11px] text-slate-400 mb-1">
                                            Địa chỉ
                                        </div>

                                        <div className="text-sm text-slate-700 font-medium">
                                            {booking.address || "Chưa có địa chỉ"}
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mt-4">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                navigate(
                                                    `/customer/bookings/${booking.id}`
                                                )
                                            }
                                            className="
                        flex-1
                        py-2.5
                        rounded-xl
                        bg-blue-600
                        text-white
                        text-xs
                        font-black
                      "
                                        >
                                            Xem chi tiết
                                        </button>

                                        {booking.status === "PENDING" && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleDelete(booking.id)
                                                }
                                                className="
                          px-4
                          rounded-xl
                          bg-rose-50
                          text-rose-600
                          text-xs
                          font-bold
                        "
                                            >
                                                Xóa
                                            </button>
                                        )}

                                        {booking.status === "WORKER_COMPLETED" &&
                                            !booking.customerAccepted && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleCustomerAccept(
                                                            booking.id
                                                        )
                                                    }
                                                    className="
                            px-4
                            rounded-xl
                            bg-purple-50
                            text-purple-600
                            text-xs
                            font-bold
                          "
                                                >
                                                    Nghiệm thu
                                                </button>
                                            )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            <ConfirmDialog
                isOpen={Boolean(confirmDialog)}
                onClose={() => setConfirmDialog(null)}
                onConfirm={() =>
                    confirmDialog?.onConfirm?.()
                }
                title={confirmDialog?.title}
                message={confirmDialog?.message}
            />
        </div>
    );
}
