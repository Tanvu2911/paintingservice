// import { useState, useEffect, useCallback } from "react";
// import { useParams, useNavigate, useOutletContext } from "react-router-dom";
// import AxiosConfig from "../../../util/AxiosConfig";
// import DashboardHeader from "../../../components/layout/DashboardHeader";
// import StatusBadge from "../../../components/common/StatusBadge";
// import LoadingSpinner from "../../../components/common/LoadingSpinner";
// import Modal from "../../../components/common/Modal";
// import OrderTimeline from "./OrderTimeline";

// export default function OrderDetail() {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const { user, showToast } = useOutletContext();

//   const [order, setOrder] = useState(null);
//   const [bookingDetails, setBookingDetails] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [supervisors, setSupervisors] = useState([]);
//   const [workers, setWorkers] = useState([]);
//   const [assignModal, setAssignModal] = useState(null); // 'supervisor' | 'worker'
//   const [selectedId, setSelectedId] = useState("");

//   // Hợp đồng
//   const [contract, setContract] = useState(null);
//   const [contractModalOpen, setContractModalOpen] = useState(false);
//   const [approving, setApproving] = useState(false);

//   // Báo cáo ngày
//   const [dailyReports, setDailyReports] = useState([]);
//   const [loadingReports, setLoadingReports] = useState(false);
//   const [reportsModalOpen, setReportsModalOpen] = useState(false);

//   const parseImageUrls = (str) => {
//     if (!str) return [];
//     if (Array.isArray(str)) return str;
//     if (typeof str !== "string") return [];
//     return str
//       .split(",")
//       .map((s) => s.trim())
//       .filter(Boolean);
//   };

//   const formatMoney = (value) => {
//     if (value == null || value === "") return "—";
//     return Number(value).toLocaleString("vi-VN") + " đ";
//   };

//   const getSurveySignatureImg = (c) => c?.surveySignatureImg || null;
//   const getSurveySigned = (c) => !!c?.surveySigned;
//   const getSurveySignedAt = (c) => c?.surveySignedAt || null;

//   const fetchOrder = useCallback(async () => {
//     try {
//       const res = await AxiosConfig.get(`/bookings/${id}`);
//       setOrder(res.data);
//     } catch {
//       showToast?.("Không tải được chi tiết đơn", "error");
//     }
//   }, [id, showToast]);

//   const fetchBookingDetail = useCallback(async (bookingId) => {
//     try {
//       const res = await AxiosConfig.get(`/booking-details/booking/${bookingId}`);
//       setBookingDetails(Array.isArray(res.data) ? res.data : []);
//     } catch (err) {
//       console.error("Lỗi tải chi tiết booking-details:", err);
//       setBookingDetails([]);
//     }
//   }, []);

//   const fetchContract = useCallback(async (bookingId) => {
//     try {
//       const res = await AxiosConfig.get("/contracts");
//       const list = Array.isArray(res.data) ? res.data : [];
//       const found = list.find(
//         (c) => c.bookingId === Number(bookingId) || c.bookingId === bookingId
//       );
//       setContract(found || null);
//     } catch (err) {
//       console.error("Lỗi tải hợp đồng:", err);
//       setContract(null);
//     }
//   }, []);

//   const fetchDailyReports = useCallback(async (bookingId) => {
//     if (!bookingId) {
//       setDailyReports([]);
//       return;
//     }
//     try {
//       setLoadingReports(true);
//       const res = await AxiosConfig.get(`/daily-reports/booking/${bookingId}`);
//       setDailyReports(Array.isArray(res.data) ? res.data : []);
//     } catch (err) {
//       console.error("Lỗi tải báo cáo ngày:", err);
//       setDailyReports([]);
//     } finally {
//       setLoadingReports(false);
//     }
//   }, []);

//   useEffect(() => {
//     let isMounted = true;

//     const loadInitialData = async () => {
//       setLoading(true);
//       try {
//         const [orderRes, supRes, workerRes] = await Promise.all([
//           AxiosConfig.get(`/bookings/${id}`),
//           AxiosConfig.get("/staff?staffType=SUPERVISOR").catch(() => ({ data: [] })),
//           AxiosConfig.get("/staff?staffType=WORKER").catch(() => ({ data: [] })),
//         ]);

//         if (!isMounted) return;

//         setOrder(orderRes.data);

//         const rawSupList = supRes.data?.content || supRes.data?.data || supRes.data || [];
//         const rawWorkerList = workerRes.data?.content || workerRes.data?.data || workerRes.data || [];

//         const availableWorkers = (Array.isArray(rawWorkerList) ? rawWorkerList : []).filter(
//           (s) => s.available !== false && s.staffType !== "SUPERVISOR"
//         );

//         setSupervisors(Array.isArray(rawSupList) ? rawSupList : []);
//         setWorkers(availableWorkers);

//         await Promise.all([
//           fetchBookingDetail(id),
//           fetchContract(id),
//           fetchDailyReports(id),
//         ]);
//       } catch {
//         if (isMounted) showToast?.("Không tải được chi tiết đơn", "error");
//       } finally {
//         if (isMounted) setLoading(false);
//       }
//     };

//     loadInitialData();
//     return () => {
//       isMounted = false;
//     };
//   }, [id, fetchBookingDetail, fetchContract, fetchDailyReports, showToast]);

//   // Phân công Giám sát (POST /api/bookings/{id}/assign-supervisor)
//   const handleAssignSupervisor = async () => {
//     if (!selectedId) {
//       showToast?.("Vui lòng chọn giám sát viên", "error");
//       return;
//     }
//     try {
//       await AxiosConfig.post(`/bookings/${id}/assign-supervisor`, {
//         supervisorId: Number(selectedId),
//       });
//       showToast?.("Đã phân công Giám sát đi khảo sát!");
//       setAssignModal(null);
//       fetchOrder();
//     } catch (err) {
//       showToast?.(
//         err.response?.data?.message || "Lỗi phân công giám sát",
//         "error"
//       );
//     }
//   };

//   // Phân công Đội thợ (POST /api/bookings/{id}/assign-team)
//   const handleAssignWorker = async () => {
//     const targetWorkerId =
//       selectedId ||
//       order?.preferredTechnicianId ||
//       order?.preferredTechnician?.id;

//     if (!targetWorkerId) {
//       showToast?.("Vui lòng chọn đội thợ thi công", "error");
//       return;
//     }
//     try {
//       await AxiosConfig.post(`/bookings/${id}/assign-team`, {
//         technicianId: Number(targetWorkerId),
//       });
//       showToast?.(
//         customerSigned
//           ? "Đã bàn giao đơn cho Đội thợ!"
//           : "Đã gán đội thợ thành công!"
//       );
//       setAssignModal(null);
//       fetchOrder();
//     } catch (err) {
//       showToast?.(
//         err.response?.data?.message || "Lỗi giao đơn cho đội thợ",
//         "error"
//       );
//     }
//   };

//   // Duyệt hợp đồng
//   const handleApproveContract = async () => {
//     if (!contract?.id) {
//       showToast?.("Không tìm thấy hợp đồng để duyệt", "error");
//       return;
//     }
//     if (
//       !window.confirm(
//         "Xác nhận duyệt hợp đồng? Sau khi duyệt, hệ thống sẽ gửi cho khách ký điện tử."
//       )
//     ) {
//       return;
//     }

//     try {
//       setApproving(true);
//       await AxiosConfig.post(`/contracts/${contract.id}/approve`);
//       showToast?.("Đã duyệt hợp đồng. Đang chờ khách ký!");
//       setContractModalOpen(false);
//       await fetchOrder();
//       await fetchContract(id);
//     } catch (err) {
//       showToast?.(
//         err.response?.data?.message || "Lỗi duyệt hợp đồng",
//         "error"
//       );
//     } finally {
//       setApproving(false);
//     }
//   };

//   // Thanh toán thù lao cho nhân viên (POST /api/bookings/{id}/pay-staff)
//   const handlePayStaff = async () => {
//     if (
//       !window.confirm(
//         "Xác nhận đã thanh toán tiền công cho Giám sát và Đội thợ?"
//       )
//     ) {
//       return;
//     }
//     try {
//       await AxiosConfig.post(`/bookings/${id}/pay-staff`);
//       showToast?.("Đã xác nhận thanh toán thành công");
//       fetchOrder();
//     } catch (err) {
//       showToast?.(
//         err.response?.data?.message || "Lỗi xử lý thanh toán",
//         "error"
//       );
//     }
//   };

//   if (loading) return <LoadingSpinner />;
//   if (!order) {
//     return (
//       <p className="text-center text-slate-400 py-20">
//         Không tìm thấy đơn hàng
//       </p>
//     );
//   }

//   const customerSigned = !!contract?.customerSigned;
//   const surveySigned = getSurveySigned(contract);
//   const surveySignatureImg = getSurveySignatureImg(contract);
//   const surveySignedAt = getSurveySignedAt(contract);
//   const hasTechnician = !!(order.technicianId || order.technician);
//   const isWorkerRejected = order.status === "WORKER_REJECTED";

//   const canAssignSupervisor = order.status === "PENDING";
//   const canAssignWorker = [
//     "WAITING_CUSTOMER_SIGNATURE",
//     "CONTRACT_APPROVED",
//     "WORKER_REJECTED",
//     "ASSIGNED",
//   ].includes(order.status);
//   const canApproveContract =
//     order.status === "WAITING_CONTRACT_APPROVAL" && !!contract;
//   const canViewContract = !!contract;
//   const canPayStaff =
//     order.status === "WORKER_COMPLETED" || order.status === "FULLY_PAID";
//   const canViewDailyReports = [
//     "CONTRACT_APPROVED",
//     "ASSIGNED",
//     "ACCEPTED",
//     "PROCESSING",
//     "WORKER_COMPLETED",
//     "COMPLETED",
//     "WAITING_CUSTOMER_SIGNATURE",
//   ].includes(order.status);

//   const currentList = assignModal === "supervisor" ? supervisors : workers;

//   const preferredWorkerName =
//     order.preferredTechnicianName ||
//     order.preferredTechnician?.fullName ||
//     order.preferredTechnician?.username ||
//     null;

//   const preferredWorkerId =
//     order.preferredTechnicianId || order.preferredTechnician?.id || null;

//   // Lấy dữ liệu chi tiết báo cáo từ BookingDetails API nếu có
//   const latestDetail = bookingDetails.length > 0 ? bookingDetails[0] : null;
//   const surveyNoteText = latestDetail?.surveyNote || order.surveyNote;
//   const materialNoteText = latestDetail?.materialNote || order.materialNote;
//   const materialShortageText = latestDetail?.materialShortage || order.materialShortage;
//   const surveyImages = parseImageUrls(latestDetail?.surveyImages || order.surveyImages);

//   return (
//     <div className="space-y-5">
//       {/* Back */}
//       <button
//         onClick={() => navigate("/admin/bookings")}
//         className="text-sm text-blue-600 hover:underline"
//       >
//         ← Quay lại danh sách
//       </button>

//       <DashboardHeader
//         title={`Chi tiết đơn #${order.id}`}
//         subtitle={order.address}
//         userName={user?.username}
//         userRole="Quản trị viên"
//         avatarChar={(user?.username || "A").charAt(0).toUpperCase()}
//       />

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
//         {/* ========== CỘT TRÁI ========== */}
//         <div className="lg:col-span-2 space-y-5">
//           {/* Thông tin đơn */}
//           <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
//             <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
//               <h3 className="font-bold text-slate-800">Thông tin đơn hàng</h3>
//               <StatusBadge status={order.status} />
//             </div>

//             <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
//               <InfoItem
//                 label="Khách hàng"
//                 value={
//                   order.customerName ||
//                   order.customer?.fullName ||
//                   order.customer?.username ||
//                   "—"
//                 }
//               />
//               <InfoItem
//                 label="Số điện thoại"
//                 value={
//                   order.customerPhone ||
//                   order.phoneNumber ||
//                   order.customer?.phoneNumber ||
//                   "—"
//                 }
//               />
//               <InfoItem
//                 label="Giám sát"
//                 value={
//                   order.surveyorName ||
//                   order.supervisorName ||
//                   order.surveyor?.username ||
//                   "—"
//                 }
//               />
//               <InfoItem
//                 label="Thợ phụ trách"
//                 value={
//                   order.technicianName ||
//                   order.technician?.username ||
//                   "—"
//                 }
//               />
//               <div className="col-span-2">
//                 <InfoItem
//                   label="Đội thợ khách chọn"
//                   value={
//                     preferredWorkerName ||
//                     "Không chỉ định (hệ thống tự chọn)"
//                   }
//                   highlight
//                 />
//               </div>

//               {(order.totalAmount != null || order.depositAmount != null) && (
//                 <div className="col-span-2 flex flex-wrap gap-3 text-xs bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
//                   <span>
//                     <strong>Tổng:</strong> {formatMoney(order.totalAmount)}
//                   </span>
//                   <span>
//                     <strong>Cọc:</strong> {formatMoney(order.depositAmount)}
//                   </span>
//                   <span>
//                     <strong>Còn lại:</strong>{" "}
//                     {formatMoney(order.remainingAmount)}
//                   </span>
//                 </div>
//               )}

//               <div className="col-span-2">
//                 <p className="text-[11px] font-bold text-slate-400 uppercase mb-0.5">
//                   Mô tả từ khách
//                 </p>
//                 <p className="text-slate-700 text-sm">
//                   {order.description || "Không có ghi chú"}
//                 </p>
//               </div>
//             </div>

//             {/* Báo cáo khảo sát */}
//             {(surveyNoteText || materialNoteText || materialShortageText || surveyImages.length > 0) && (
//               <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
//                 <p className="text-[11px] font-bold text-slate-400 uppercase">
//                   Báo cáo khảo sát
//                 </p>
//                 {surveyNoteText && (
//                   <p className="text-sm text-slate-700">
//                     <span className="font-semibold">Ghi chú: </span>
//                     {surveyNoteText}
//                   </p>
//                 )}
//                 {materialNoteText && (
//                   <p className="text-sm text-slate-700">
//                     <span className="font-semibold">Vật tư: </span>
//                     {materialNoteText}
//                   </p>
//                 )}
//                 {materialShortageText && (
//                   <p className="text-sm text-amber-700">
//                     <span className="font-semibold">Báo thiếu vật tư: </span>
//                     {materialShortageText}
//                   </p>
//                 )}
//                 {surveyImages.length > 0 && (
//                   <div className="grid grid-cols-4 gap-2 pt-1">
//                     {surveyImages.map((url, i) => (
//                       <a
//                         key={i}
//                         href={url}
//                         target="_blank"
//                         rel="noopener noreferrer"
//                         className="aspect-square rounded-lg overflow-hidden border border-slate-200"
//                       >
//                         <img
//                           src={url}
//                           alt={`survey-${i}`}
//                           className="w-full h-full object-cover hover:scale-105 transition"
//                         />
//                       </a>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             )}

//             {!customerSigned && hasTechnician && (
//               <p className="mt-3 text-[11px] text-amber-600">
//                 Đã gán thợ sẵn — chờ khách ký HĐ mới chính thức bàn giao.
//               </p>
//             )}
//             {isWorkerRejected && (
//               <div className="mt-3 p-2.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs">
//                 <strong>Đội thợ đã từ chối.</strong> Vui lòng gán thợ khác.
//               </div>
//             )}
//           </div>

//           {/* Báo cáo ngày (preview) */}
//           {canViewDailyReports && (
//             <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
//               <div className="flex items-center justify-between mb-3">
//                 <h3 className="font-bold text-slate-800">
//                   Báo cáo tiến độ ngày
//                 </h3>
//                 <button
//                   type="button"
//                   onClick={() => {
//                     fetchDailyReports(id);
//                     setReportsModalOpen(true);
//                   }}
//                   className="text-xs font-semibold text-orange-600 hover:text-orange-700"
//                 >
//                   Xem tất cả ({dailyReports.length})
//                 </button>
//               </div>

//               {loadingReports ? (
//                 <p className="text-sm text-slate-400 py-4 text-center">
//                   Đang tải...
//                 </p>
//               ) : dailyReports.length === 0 ? (
//                 <p className="text-sm text-slate-400 py-4 text-center">
//                   Chưa có báo cáo ngày nào.
//                 </p>
//               ) : (
//                 <div className="space-y-2">
//                   {dailyReports.slice(0, 3).map((r, idx) => {
//                     const imgs = parseImageUrls(r.progressImages);
//                     return (
//                       <div
//                         key={r.id || idx}
//                         className="flex gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50"
//                       >
//                         <div className="flex-1 min-w-0">
//                           <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
//                             <span className="font-semibold text-slate-700">
//                               #{dailyReports.length - idx}
//                             </span>
//                             <span>·</span>
//                             <span>{r.reporterName || "—"}</span>
//                             {r.createdAt && (
//                               <>
//                                 <span>·</span>
//                                 <span>
//                                   {new Date(r.createdAt).toLocaleString(
//                                     "vi-VN",
//                                     {
//                                       day: "2-digit",
//                                       month: "2-digit",
//                                       hour: "2-digit",
//                                       minute: "2-digit",
//                                     }
//                                   )}
//                                 </span>
//                               </>
//                             )}
//                             {r.progressPercentage != null && (
//                               <span className="ml-auto font-bold text-orange-600">
//                                 {r.progressPercentage}%
//                               </span>
//                             )}
//                           </div>
//                           <p className="text-sm text-slate-700 line-clamp-2">
//                             {r.content || "Không có nội dung"}
//                           </p>
//                           {imgs.length > 0 && (
//                             <p className="text-[11px] text-slate-400 mt-1">
//                               📷 {imgs.length} ảnh
//                             </p>
//                           )}
//                         </div>
//                       </div>
//                     );
//                   })}
//                   {dailyReports.length > 3 && (
//                     <button
//                       type="button"
//                       onClick={() => setReportsModalOpen(true)}
//                       className="w-full text-xs text-slate-500 hover:text-slate-700 py-1"
//                     >
//                       + {dailyReports.length - 3} báo cáo khác
//                     </button>
//                   )}
//                 </div>
//               )}
//             </div>
//           )}

//           <OrderTimeline history={order.history || []} />
//         </div>

//         {/* ========== CỘT PHẢI: HÀNH ĐỘNG ========== */}
//         <div className="space-y-4">
//           <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm sticky top-4">
//             <h3 className="font-bold text-slate-800 mb-4 pb-3 border-b border-slate-100">
//               Hành động
//             </h3>

//             <div className="space-y-2.5">
//               {canAssignSupervisor && (
//                 <ActionBtn
//                   color="blue"
//                   onClick={() => {
//                     setSelectedId("");
//                     setAssignModal("supervisor");
//                   }}
//                 >
//                   Phân công Giám sát khảo sát
//                 </ActionBtn>
//               )}

//               {order.status === "SURVEY_ASSIGNED" && (
//                 <HintBox color="amber">
//                   <strong>Đang khảo sát.</strong> Giám sát đo đạc và lập HĐ.
//                 </HintBox>
//               )}

//               {order.status === "WAITING_CONTRACT_APPROVAL" && (
//                 <>
//                   <HintBox color="indigo">
//                     <strong>HĐ chờ duyệt.</strong> Kiểm tra rồi duyệt để gửi
//                     khách ký.
//                     {surveySigned && (
//                       <span className="block mt-1 text-emerald-700">
//                         ✓ Giám sát đã ký
//                       </span>
//                     )}
//                   </HintBox>
//                   {canViewContract && (
//                     <ActionBtn
//                       color="indigo"
//                       onClick={() => setContractModalOpen(true)}
//                     >
//                       📜 Xem hợp đồng
//                     </ActionBtn>
//                   )}
//                   {canApproveContract && (
//                     <ActionBtn
//                       color="emerald"
//                       onClick={handleApproveContract}
//                       disabled={approving}
//                     >
//                       {approving ? "Đang duyệt..." : "✅ Duyệt hợp đồng"}
//                     </ActionBtn>
//                   )}
//                   {!contract && (
//                     <p className="text-xs text-amber-600">
//                       Chưa tải được HĐ. Thử làm mới trang.
//                     </p>
//                   )}
//                 </>
//               )}

//               {order.status === "WAITING_CUSTOMER_SIGNATURE" && (
//                 <>
//                   <HintBox color="amber">
//                     <strong>Chờ khách ký.</strong> Đã duyệt HĐ, đang chờ ký điện
//                     tử.
//                   </HintBox>
//                   {canViewContract && (
//                     <ActionBtn
//                       color="slate"
//                       onClick={() => setContractModalOpen(true)}
//                     >
//                       📜 Xem hợp đồng
//                     </ActionBtn>
//                   )}
//                 </>
//               )}

//               {order.status === "CONTRACT_APPROVED" && customerSigned && (
//                 <>
//                   <HintBox color="emerald">
//                     <strong>Khách đã ký.</strong> Có thể bàn giao / bắt đầu thi
//                     công.
//                   </HintBox>
//                   {canViewContract && (
//                     <ActionBtn
//                       color="slate"
//                       onClick={() => setContractModalOpen(true)}
//                     >
//                       📜 Xem hợp đồng
//                     </ActionBtn>
//                   )}
//                 </>
//               )}

//               {isWorkerRejected && (
//                 <HintBox color="red">
//                   <strong>Thợ từ chối.</strong> Gán đội thợ khác.
//                 </HintBox>
//               )}

//               {canAssignWorker && (
//                 <ActionBtn
//                   color="teal"
//                   onClick={() => {
//                     setSelectedId(String(preferredWorkerId || ""));
//                     setAssignModal("worker");
//                   }}
//                 >
//                   {isWorkerRejected || !hasTechnician
//                     ? "Gán Đội thợ thi công"
//                     : "Thay đổi / Gán lại Đội thợ"}
//                 </ActionBtn>
//               )}

//               {order.status === "PROCESSING" && (
//                 <>
//                   <HintBox color="blue">
//                     <strong>Đang thi công.</strong> Đội thợ cập nhật nhật ký
//                     ngày.
//                   </HintBox>
//                   {canViewContract && (
//                     <ActionBtn
//                       color="slate"
//                       onClick={() => setContractModalOpen(true)}
//                     >
//                       📜 Xem hợp đồng
//                     </ActionBtn>
//                   )}
//                 </>
//               )}

//               {order.status === "WORKER_COMPLETED" && (
//                 <HintBox color="purple">
//                   <strong>Thợ hoàn thành.</strong> Chờ nghiệm thu / thanh toán.
//                 </HintBox>
//               )}

//               {canPayStaff && (
//                 <ActionBtn color="emerald" onClick={handlePayStaff}>
//                   Xác nhận thanh toán tiền công
//                 </ActionBtn>
//               )}

//               {canViewDailyReports && (
//                 <ActionBtn
//                   color="orange"
//                   onClick={() => {
//                     fetchDailyReports(id);
//                     setReportsModalOpen(true);
//                   }}
//                 >
//                   📅 Báo cáo ngày ({dailyReports.length})
//                 </ActionBtn>
//               )}

//               {canViewContract &&
//                 ![
//                   "WAITING_CONTRACT_APPROVAL",
//                   "WAITING_CUSTOMER_SIGNATURE",
//                   "CONTRACT_APPROVED",
//                   "PROCESSING",
//                 ].includes(order.status) && (
//                   <ActionBtn
//                     color="slate"
//                     onClick={() => setContractModalOpen(true)}
//                   >
//                     📜 Xem hợp đồng
//                   </ActionBtn>
//                 )}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Modal chọn NV */}
//       <Modal
//         isOpen={!!assignModal}
//         onClose={() => setAssignModal(null)}
//         title={
//           assignModal === "supervisor"
//             ? "Phân công Giám sát khảo sát"
//             : "Gán / đổi Đội thợ thi công"
//         }
//       >
//         <div className="space-y-4">
//           {currentList.length === 0 ? (
//             <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-sm space-y-2">
//               <p className="font-semibold">
//                 Không tìm thấy{" "}
//                 {assignModal === "supervisor" ? "Giám sát" : "Thợ"} khả dụng.
//               </p>
//               <button
//                 type="button"
//                 onClick={() => navigate("/admin/employees")}
//                 className="px-3 py-1.5 bg-amber-600 text-white font-bold rounded-lg text-xs hover:bg-amber-700"
//               >
//                 + Thêm nhân viên
//               </button>
//             </div>
//           ) : (
//             <div>
//               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
//                 {assignModal === "supervisor" ? "Giám sát viên" : "Đội thợ"}
//               </label>
//               <select
//                 className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
//                 value={selectedId}
//                 onChange={(e) => setSelectedId(e.target.value)}
//               >
//                 <option value="">-- Chọn --</option>
//                 {currentList.map((s) => {
//                   const sId = String(s.userId || s.id);
//                   const isPreferred =
//                     assignModal === "worker" &&
//                     preferredWorkerId &&
//                     String(preferredWorkerId) === sId;
//                   return (
//                     <option key={sId} value={sId}>
//                       {s.fullName || s.username || `NV #${sId}`}
//                       {isPreferred ? " ★ (Khách chọn)" : ""}
//                       {s.specialty ? ` – ${s.specialty}` : ""}
//                       {s.available === false ? " (Bận)" : ""}
//                     </option>
//                   );
//                 })}
//               </select>
//               {assignModal === "worker" && !customerSigned && (
//                 <p className="text-[11px] text-amber-600 mt-2">
//                   Gán sẵn. Chỉ sau khi khách ký HĐ mới chính thức bàn giao.
//                 </p>
//               )}
//             </div>
//           )}

//           <div className="flex gap-3 pt-1">
//             <button
//               type="button"
//               onClick={() => setAssignModal(null)}
//               className="flex-1 py-2 bg-slate-100 font-bold text-slate-600 rounded-xl text-sm hover:bg-slate-200"
//             >
//               Hủy
//             </button>
//             {currentList.length > 0 && (
//               <button
//                 type="button"
//                 onClick={
//                   assignModal === "supervisor"
//                     ? handleAssignSupervisor
//                     : handleAssignWorker
//                 }
//                 className="flex-1 py-2 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700"
//               >
//                 Xác nhận
//               </button>
//             )}
//           </div>
//         </div>
//       </Modal>

//       {/* Modal hợp đồng */}
//       <Modal
//         isOpen={contractModalOpen}
//         onClose={() => setContractModalOpen(false)}
//         title="Chi tiết hợp đồng"
//       >
//         {contract ? (
//           <div className="space-y-4">
//             <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
//               <span>Mã: {contract.contractCode}</span>
//               <span
//                 className={
//                   contract.customerSigned ? "text-emerald-600" : "text-amber-500"
//                 }
//               >
//                 {contract.customerSigned ? "Khách đã ký" : "Chờ khách ký"}
//               </span>
//             </div>

//             {/* Trạng thái chữ ký tóm tắt */}
//             <div className="flex flex-wrap gap-2 text-xs">
//               <span
//                 className={
//                   "px-2.5 py-1 rounded-full font-semibold " +
//                   (surveySigned
//                     ? "bg-blue-50 text-blue-700"
//                     : "bg-slate-100 text-slate-500")
//                 }
//               >
//                 {surveySigned ? "✓ Giám sát đã ký" : "○ Giám sát chưa ký"}
//               </span>
//               <span
//                 className={
//                   "px-2.5 py-1 rounded-full font-semibold " +
//                   (contract.customerSigned
//                     ? "bg-emerald-50 text-emerald-700"
//                     : "bg-slate-100 text-slate-500")
//                 }
//               >
//                 {contract.customerSigned
//                   ? "✓ Khách đã ký"
//                   : "○ Khách chưa ký"}
//               </span>
//             </div>

//             <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap min-h-[160px] max-h-[300px] overflow-y-auto">
//               {contract.content || "Chưa có nội dung"}
//             </div>

//             {/* Chữ ký */}
//             {(surveySignatureImg || contract.customerSignatureImg) && (
//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                 {surveySignatureImg && (
//                   <div className="border border-blue-100 rounded-xl p-3 bg-blue-50/40">
//                     <p className="text-[10px] font-bold text-blue-700 uppercase mb-2 tracking-wide">
//                       Chữ ký Giám sát / Khảo sát viên
//                     </p>
//                     <div className="bg-white rounded-lg border border-blue-100 p-2 flex items-center justify-center min-h-[80px]">
//                       <img
//                         src={surveySignatureImg}
//                         alt="Chữ ký giám sát"
//                         className="max-h-28 max-w-full object-contain"
//                       />
//                     </div>
//                     {surveySignedAt && (
//                       <p className="text-[10px] text-slate-500 mt-1.5">
//                         Ký lúc:{" "}
//                         {new Date(surveySignedAt).toLocaleString("vi-VN")}
//                       </p>
//                     )}
//                   </div>
//                 )}
//                 {contract.customerSignatureImg && (
//                   <div className="border border-emerald-100 rounded-xl p-3 bg-emerald-50/40">
//                     <p className="text-[10px] font-bold text-emerald-700 uppercase mb-2 tracking-wide">
//                       Chữ ký khách hàng
//                     </p>
//                     <div className="bg-white rounded-lg border border-emerald-100 p-2 flex items-center justify-center min-h-[80px]">
//                       <img
//                         src={contract.customerSignatureImg}
//                         alt="Chữ ký khách"
//                         className="max-h-28 max-w-full object-contain"
//                       />
//                     </div>
//                     {contract.customerSignedAt && (
//                       <p className="text-[10px] text-slate-500 mt-1.5">
//                         Ký lúc:{" "}
//                         {new Date(contract.customerSignedAt).toLocaleString("vi-VN")}
//                       </p>
//                     )}
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>
//         ) : (
//           <p className="text-sm text-slate-500 py-4 text-center">
//             Không tìm thấy thông tin hợp đồng.
//           </p>
//         )}
//       </Modal>

//       {/* Modal danh sách tất cả báo cáo ngày */}
//       <Modal
//         isOpen={reportsModalOpen}
//         onClose={() => setReportsModalOpen(false)}
//         title={`Tất cả báo cáo tiến độ (${dailyReports.length})`}
//       >
//         <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
//           {dailyReports.length === 0 ? (
//             <p className="text-sm text-slate-400 py-4 text-center">
//               Chưa có báo cáo ngày nào.
//             </p>
//           ) : (
//             dailyReports.map((r, idx) => {
//               const imgs = parseImageUrls(r.progressImages);
//               return (
//                 <div
//                   key={r.id || idx}
//                   className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 text-sm space-y-2"
//                 >
//                   <div className="flex items-center justify-between text-xs text-slate-500">
//                     <span className="font-bold text-slate-800">
//                       #{dailyReports.length - idx} - {r.reporterName || "N/A"}
//                     </span>
//                     {r.progressPercentage != null && (
//                       <span className="font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">
//                         {r.progressPercentage}%
//                       </span>
//                     )}
//                   </div>
//                   <p className="text-slate-700 whitespace-pre-line">
//                     {r.content || "Không có nội dung"}
//                   </p>
//                   {imgs.length > 0 && (
//                     <div className="grid grid-cols-3 gap-2 pt-1">
//                       {imgs.map((url, i) => (
//                         <a
//                           key={i}
//                           href={url}
//                           target="_blank"
//                           rel="noopener noreferrer"
//                           className="aspect-square rounded-lg overflow-hidden border border-slate-200"
//                         >
//                           <img
//                             src={url}
//                             alt={`report-img-${i}`}
//                             className="w-full h-full object-cover"
//                           />
//                         </a>
//                       ))}
//                     </div>
//                   )}
//                   {r.createdAt && (
//                     <p className="text-[10px] text-slate-400 text-right">
//                       {new Date(r.createdAt).toLocaleString("vi-VN")}
//                     </p>
//                   )}
//                 </div>
//               );
//             })
//           )}
//         </div>
//       </Modal>
//     </div>
//   );
// }

// // Subcomponents trợ giúp hiển thị UI
// function InfoItem({ label, value, highlight }) {
//   return (
//     <div>
//       <p className="text-[11px] font-bold text-slate-400 uppercase mb-0.5">
//         {label}
//       </p>
//       <p
//         className={`text-sm ${
//           highlight ? "font-semibold text-blue-600" : "text-slate-800"
//         }`}
//       >
//         {value}
//       </p>
//     </div>
//   );
// }

// function ActionBtn({ children, color, onClick, disabled }) {
//   const colorMap = {
//     blue: "bg-blue-600 hover:bg-blue-700 text-white",
//     teal: "bg-teal-600 hover:bg-teal-700 text-white",
//     indigo: "bg-indigo-600 hover:bg-indigo-700 text-white",
//     emerald: "bg-emerald-600 hover:bg-emerald-700 text-white",
//     orange: "bg-orange-600 hover:bg-orange-700 text-white",
//     slate: "bg-slate-700 hover:bg-slate-800 text-white",
//   };

//   return (
//     <button
//       type="button"
//       onClick={onClick}
//       disabled={disabled}
//       className={`w-full py-2.5 px-4 rounded-xl font-bold text-sm transition shadow-sm disabled:opacity-50 ${
//         colorMap[color] || colorMap.slate
//       }`}
//     >
//       {children}
//     </button>
//   );
// }

// function HintBox({ children, color }) {
//   const colorMap = {
//     amber: "bg-amber-50 border-amber-200 text-amber-800",
//     indigo: "bg-indigo-50 border-indigo-200 text-indigo-800",
//     emerald: "bg-emerald-50 border-emerald-200 text-emerald-800",
//     blue: "bg-blue-50 border-blue-200 text-blue-800",
//     red: "bg-red-50 border-red-200 text-red-800",
//     purple: "bg-purple-50 border-purple-200 text-purple-800",
//   };

//   return (
//     <div
//       className={`p-3 rounded-xl border text-xs leading-relaxed ${
//         colorMap[color] || colorMap.amber
//       }`}
//     >
//       {children}
//     </div>
//   );
// }

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";

import AxiosConfig from "../../../util/AxiosConfig";

import DashboardHeader from "../../../components/layout/DashboardHeader";
import StatusBadge from "../../../components/common/StatusBadge";
import LoadingSpinner from "../../../components/common/LoadingSpinner";
import Modal from "../../../components/common/Modal";

import OrderTimeline from "./OrderTimeline";
import CreateContractModal from "../../../components/admin/contracts/CreateContractModal";

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, showToast } = useOutletContext();

  /* =========================================================
     STATE
  ========================================================= */

  const [order, setOrder] = useState(null);
  const [bookingDetails, setBookingDetails] = useState([]);

  const [loading, setLoading] = useState(true);

  /* Nhân viên */
  const [supervisors, setSupervisors] = useState([]);
  const [workers, setWorkers] = useState([]);

  const [assignModal, setAssignModal] = useState(null);
  // null | "supervisor" | "worker"

  const [selectedId, setSelectedId] = useState("");

  /* =========================================================
     HỢP ĐỒNG
  ========================================================= */

  const [contract, setContract] = useState(null);

  /* Modal xem hợp đồng */
  const [contractModalOpen, setContractModalOpen] = useState(false);

  /* Modal lập hợp đồng */
  const [createContractModalOpen, setCreateContractModalOpen] =
    useState(false);

  const [approving, setApproving] = useState(false);

  /* =========================================================
     BÁO CÁO NGÀY
  ========================================================= */

  const [dailyReports, setDailyReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportsModalOpen, setReportsModalOpen] = useState(false);

  /* =========================================================
     HELPER
  ========================================================= */

  const parseImageUrls = (str) => {
    if (!str) return [];

    if (Array.isArray(str)) {
      return str;
    }

    if (typeof str !== "string") {
      return [];
    }

    return str
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const formatMoney = (value) => {
    if (value == null || value === "") {
      return "—";
    }

    return Number(value).toLocaleString("vi-VN") + " đ";
  };

  const getSurveySignatureImg = (c) => {
    return c?.surveySignatureImg || null;
  };

  const getSurveySigned = (c) => {
    return !!c?.surveySigned;
  };

  const getSurveySignedAt = (c) => {
    return c?.surveySignedAt || null;
  };

  /* =========================================================
     FETCH ORDER
  ========================================================= */

  const fetchOrder = useCallback(async () => {
    try {
      const res = await AxiosConfig.get(`/bookings/${id}`);

      setOrder(res.data);

      return res.data;
    } catch (err) {
      console.error("Lỗi tải đơn hàng:", err);

      showToast?.(
        "Không tải được chi tiết đơn",
        "error"
      );

      return null;
    }
  }, [id, showToast]);

  /* =========================================================
     FETCH BOOKING DETAILS
  ========================================================= */

  const fetchBookingDetail = useCallback(
    async (bookingId) => {
      try {
        const res = await AxiosConfig.get(
          `/booking-details/booking/${bookingId}`
        );

        const data = Array.isArray(res.data)
          ? res.data
          : [];

        setBookingDetails(data);

        return data;
      } catch (err) {
        console.error(
          "Lỗi tải chi tiết booking-details:",
          err
        );

        setBookingDetails([]);

        return [];
      }
    },
    []
  );

  /* =========================================================
     FETCH CONTRACT
  ========================================================= */

  const fetchContract = useCallback(
    async (bookingId) => {
      try {
        const res = await AxiosConfig.get("/contracts");

        const list = Array.isArray(res.data)
          ? res.data
          : [];

        const found = list.find(
          (c) =>
            c.bookingId === Number(bookingId) ||
            c.bookingId === bookingId
        );

        setContract(found || null);

        return found || null;
      } catch (err) {
        console.error(
          "Lỗi tải hợp đồng:",
          err
        );

        setContract(null);

        return null;
      }
    },
    []
  );

  /* =========================================================
     FETCH DAILY REPORTS
  ========================================================= */

  const fetchDailyReports = useCallback(
    async (bookingId) => {
      if (!bookingId) {
        setDailyReports([]);
        return [];
      }

      try {
        setLoadingReports(true);

        const res = await AxiosConfig.get(
          `/daily-reports/booking/${bookingId}`
        );

        const data = Array.isArray(res.data)
          ? res.data
          : [];

        setDailyReports(data);

        return data;
      } catch (err) {
        console.error(
          "Lỗi tải báo cáo ngày:",
          err
        );

        setDailyReports([]);

        return [];
      } finally {
        setLoadingReports(false);
      }
    },
    []
  );

  /* =========================================================
     LOAD INITIAL DATA
  ========================================================= */

  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      setLoading(true);

      try {
        const [
          orderRes,
          supRes,
          workerRes,
        ] = await Promise.all([
          AxiosConfig.get(`/bookings/${id}`),

          AxiosConfig.get(
            "/staff?staffType=SUPERVISOR"
          ).catch(() => ({
            data: [],
          })),

          AxiosConfig.get(
            "/staff?staffType=WORKER"
          ).catch(() => ({
            data: [],
          })),
        ]);

        if (!isMounted) {
          return;
        }

        /* =========================
           ORDER
        ========================= */

        setOrder(orderRes.data);

        /* =========================
           SUPERVISOR
        ========================= */

        const rawSupList =
          supRes.data?.content ||
          supRes.data?.data ||
          supRes.data ||
          [];

        /* =========================
           WORKER
        ========================= */

        const rawWorkerList =
          workerRes.data?.content ||
          workerRes.data?.data ||
          workerRes.data ||
          [];

        const availableWorkers = (
          Array.isArray(rawWorkerList)
            ? rawWorkerList
            : []
        ).filter(
          (s) =>
            s.available !== false &&
            s.staffType !== "SUPERVISOR"
        );

        setSupervisors(
          Array.isArray(rawSupList)
            ? rawSupList
            : []
        );

        setWorkers(availableWorkers);

        /* =========================
           OTHER DATA
        ========================= */

        await Promise.all([
          fetchBookingDetail(id),
          fetchContract(id),
          fetchDailyReports(id),
        ]);
      } catch (err) {
        console.error(
          "Lỗi load OrderDetail:",
          err
        );

        if (isMounted) {
          showToast?.(
            "Không tải được chi tiết đơn",
            "error"
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
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
    showToast,
  ]);

  /* =========================================================
     PHÂN CÔNG GIÁM SÁT
  ========================================================= */

  const handleAssignSupervisor = async () => {
    if (!selectedId) {
      showToast?.(
        "Vui lòng chọn giám sát viên",
        "error"
      );

      return;
    }

    try {
      await AxiosConfig.post(
        `/bookings/${id}/assign-supervisor`,
        {
          supervisorId: Number(selectedId),
        }
      );

      showToast?.(
        "Đã phân công Giám sát đi khảo sát!"
      );

      setAssignModal(null);
      setSelectedId("");

      await fetchOrder();
    } catch (err) {
      console.error(
        "Lỗi phân công giám sát:",
        err
      );

      showToast?.(
        err.response?.data?.message ||
        "Lỗi phân công giám sát",
        "error"
      );
    }
  };

  /* =========================================================
     PHÂN CÔNG ĐỘI THỢ
  ========================================================= */

  const handleAssignWorker = async () => {
    const targetWorkerId =
      selectedId ||
      order?.preferredTechnicianId ||
      order?.preferredTechnician?.id;

    if (!targetWorkerId) {
      showToast?.(
        "Vui lòng chọn đội thợ thi công",
        "error"
      );

      return;
    }

    try {
      await AxiosConfig.post(
        `/bookings/${id}/assign-team`,
        {
          technicianId: Number(targetWorkerId),
        }
      );

      showToast?.(
        customerSigned
          ? "Đã bàn giao đơn cho Đội thợ!"
          : "Đã gán đội thợ thành công!"
      );

      setAssignModal(null);
      setSelectedId("");

      await fetchOrder();
    } catch (err) {
      console.error(
        "Lỗi giao đơn cho đội thợ:",
        err
      );

      showToast?.(
        err.response?.data?.message ||
        "Lỗi giao đơn cho đội thợ",
        "error"
      );
    }
  };

  /* =========================================================
     MỞ MODAL LẬP HỢP ĐỒNG
  ========================================================= */

  const handleOpenCreateContract = async () => {
    if (!order?.id) {
      showToast?.(
        "Không xác định được đơn hàng",
        "error"
      );

      return;
    }

    if (contract) {
      showToast?.(
        "Đơn hàng này đã có hợp đồng",
        "error"
      );

      return;
    }

    /*
     * Đảm bảo dữ liệu báo cáo khảo sát mới nhất
     */
    const details = await fetchBookingDetail(id);

    if (!details || details.length === 0) {
      showToast?.(
        "Chưa nhận được báo cáo khảo sát từ Giám sát",
        "error"
      );

      return;
    }

    setCreateContractModalOpen(true);
  };

  /* =========================================================
     SAU KHI TẠO HỢP ĐỒNG
  ========================================================= */

  const handleContractCreated = async () => {
    setCreateContractModalOpen(false);

    await fetchContract(id);
    await fetchOrder();

    showToast?.(
      "Đã lập hợp đồng. Vui lòng kiểm tra và duyệt trước khi gửi khách."
    );
  };

  /* =========================================================
     DUYỆT HỢP ĐỒNG
  ========================================================= */

  const handleApproveContract = async () => {
    if (!contract?.id) {
      showToast?.(
        "Không tìm thấy hợp đồng để duyệt",
        "error"
      );

      return;
    }

    if (
      !window.confirm(
        "Xác nhận duyệt hợp đồng?\n\nSau khi duyệt, hệ thống sẽ gửi hợp đồng cho khách ký điện tử."
      )
    ) {
      return;
    }

    try {
      setApproving(true);

      await AxiosConfig.post(
        `/contracts/${contract.id}/approve`
      );

      showToast?.(
        "Đã duyệt hợp đồng. Đang chờ khách ký!"
      );

      setContractModalOpen(false);

      await fetchOrder();
      await fetchContract(id);
    } catch (err) {
      console.error(
        "Lỗi duyệt hợp đồng:",
        err
      );

      showToast?.(
        err.response?.data?.message ||
        "Lỗi duyệt hợp đồng",
        "error"
      );
    } finally {
      setApproving(false);
    }
  };

  /* =========================================================
     THANH TOÁN NHÂN VIÊN
  ========================================================= */

  const handlePayStaff = async () => {
    if (
      !window.confirm(
        "Xác nhận đã thanh toán tiền công cho Giám sát và Đội thợ?"
      )
    ) {
      return;
    }

    try {
      await AxiosConfig.post(
        `/bookings/${id}/pay-staff`
      );

      showToast?.(
        "Đã xác nhận thanh toán thành công"
      );

      await fetchOrder();
    } catch (err) {
      console.error(
        "Lỗi thanh toán nhân viên:",
        err
      );

      showToast?.(
        err.response?.data?.message ||
        "Lỗi xử lý thanh toán",
        "error"
      );
    }
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return <LoadingSpinner />;
  }

  /* =========================================================
     NOT FOUND
  ========================================================= */

  if (!order) {
    return (
      <p className="text-center text-slate-400 py-20">
        Không tìm thấy đơn hàng
      </p>
    );
  }

  /* =========================================================
     DATA
  ========================================================= */

  const customerSigned =
    !!contract?.customerSigned;

  const surveySigned =
    getSurveySigned(contract);

  const surveySignatureImg =
    getSurveySignatureImg(contract);

  const surveySignedAt =
    getSurveySignedAt(contract);

  const hasTechnician =
    !!(
      order.technicianId ||
      order.technician
    );

  const isWorkerRejected =
    order.status === "WORKER_REJECTED";

  /* =========================================================
     STATUS CONDITIONS
  ========================================================= */

  const canAssignSupervisor =
    order.status === "PENDING";

  const canAssignWorker = [
    "WAITING_CUSTOMER_SIGNATURE",
    "CONTRACT_APPROVED",
    "WORKER_REJECTED",
    "ASSIGNED",
  ].includes(order.status);

  const canApproveContract =
    order.status ===
    "WAITING_CONTRACT_APPROVAL" &&
    !!contract;

  const canViewContract =
    !!contract;

  const canPayStaff =
    order.status === "WORKER_COMPLETED" ||
    order.status === "FULLY_PAID";

  const canViewDailyReports = [
    "CONTRACT_APPROVED",
    "ASSIGNED",
    "ACCEPTED",
    "PROCESSING",
    "WORKER_COMPLETED",
    "COMPLETED",
    "WAITING_CUSTOMER_SIGNATURE",
  ].includes(order.status);

  /*
   * QUAN TRỌNG:
   *
   * Sau khi Giám sát gửi báo cáo:
   * Admin mới được lập hợp đồng.
   *
   * Nếu backend của bạn dùng status khác,
   * sửa danh sách này.
   */
  const canCreateContract =
    !contract &&
    bookingDetails.length > 0 &&
    [
      "SURVEY_COMPLETED",
      "WAITING_CONTRACT_CREATION",
    ].includes(order.status);

  /* =========================================================
     CURRENT LIST
  ========================================================= */

  const currentList =
    assignModal === "supervisor"
      ? supervisors
      : workers;

  /* =========================================================
     PREFERRED WORKER
  ========================================================= */

  const preferredWorkerName =
    order.preferredTechnicianName ||
    order.preferredTechnician?.fullName ||
    order.preferredTechnician?.username ||
    null;

  const preferredWorkerId =
    order.preferredTechnicianId ||
    order.preferredTechnician?.id ||
    null;

  /* =========================================================
     LATEST SURVEY DETAIL
  ========================================================= */

  const latestDetail =
    bookingDetails.length > 0
      ? bookingDetails[0]
      : null;

  const surveyNoteText =
    latestDetail?.surveyNote ||
    order.surveyNote;

  const materialNoteText =
    latestDetail?.materialNote ||
    order.materialNote;

  const materialShortageText =
    latestDetail?.materialShortage ||
    order.materialShortage;

  const surveyImages = parseImageUrls(
    latestDetail?.surveyImages ||
    order.surveyImages
  );

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="space-y-5">
      {/* =====================================================
          BACK
      ====================================================== */}

      <button
        onClick={() =>
          navigate("/admin/bookings")
        }
        className="text-sm text-blue-600 hover:underline"
      >
        ← Quay lại danh sách
      </button>

      {/* =====================================================
          HEADER
      ====================================================== */}

      <DashboardHeader
        title={`Chi tiết đơn #${order.id}`}
        subtitle={order.address}
        userName={user?.username}
        userRole="Quản trị viên"
        avatarChar={(
          user?.username || "A"
        )
          .charAt(0)
          .toUpperCase()}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ===================================================
            CỘT TRÁI
        ==================================================== */}

        <div className="lg:col-span-2 space-y-5">
          {/* =================================================
              THÔNG TIN ĐƠN
          ================================================== */}

          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">
                Thông tin đơn hàng
              </h3>

              <StatusBadge
                status={order.status}
              />
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

              {/* TIỀN */}

              {(
                order.totalAmount != null ||
                order.depositAmount != null
              ) && (
                  <div className="col-span-2 flex flex-wrap gap-3 text-xs bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                    <span>
                      <strong>Tổng:</strong>{" "}
                      {formatMoney(
                        order.totalAmount
                      )}
                    </span>

                    <span>
                      <strong>Cọc:</strong>{" "}
                      {formatMoney(
                        order.depositAmount
                      )}
                    </span>

                    <span>
                      <strong>Còn lại:</strong>{" "}
                      {formatMoney(
                        order.remainingAmount
                      )}
                    </span>
                  </div>
                )}

              {/* MÔ TẢ */}

              <div className="col-span-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase mb-0.5">
                  Mô tả từ khách
                </p>

                <p className="text-slate-700 text-sm">
                  {order.description ||
                    "Không có ghi chú"}
                </p>
              </div>
            </div>

            {/* =================================================
                BÁO CÁO KHẢO SÁT
            ================================================== */}

            {(
              surveyNoteText ||
              materialNoteText ||
              materialShortageText ||
              surveyImages.length > 0
            ) && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold text-slate-400 uppercase">
                      Báo cáo khảo sát từ Giám sát
                    </p>

                    <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                      ĐÃ NHẬN
                    </span>
                  </div>

                  {/* GHI CHÚ */}

                  {surveyNoteText && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500">
                        Ghi chú khảo sát
                      </p>

                      <p className="text-sm text-slate-700 whitespace-pre-line mt-1">
                        {surveyNoteText}
                      </p>
                    </div>
                  )}

                  {/* VẬT TƯ */}

                  {materialNoteText && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500">
                        Vật tư
                      </p>

                      <p className="text-sm text-slate-700 whitespace-pre-line mt-1">
                        {materialNoteText}
                      </p>
                    </div>
                  )}

                  {/* THIẾU VẬT TƯ */}

                  {materialShortageText && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                      <p className="text-xs font-semibold text-amber-700">
                        Báo thiếu vật tư
                      </p>

                      <p className="text-sm text-amber-800 whitespace-pre-line mt-1">
                        {materialShortageText}
                      </p>
                    </div>
                  )}

                  {/* ẢNH */}

                  {surveyImages.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 mb-2">
                        Hình ảnh khảo sát
                      </p>

                      <div className="grid grid-cols-4 gap-2">
                        {surveyImages.map(
                          (url, i) => (
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
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

            {!customerSigned &&
              hasTechnician && (
                <p className="mt-3 text-[11px] text-amber-600">
                  Đã gán thợ sẵn — chờ khách ký HĐ
                  mới chính thức bàn giao.
                </p>
              )}

            {isWorkerRejected && (
              <div className="mt-3 p-2.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs">
                <strong>
                  Đội thợ đã từ chối.
                </strong>{" "}
                Vui lòng gán thợ khác.
              </div>
            )}
          </div>

          {/* =================================================
              BÁO CÁO NGÀY
          ================================================== */}

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
                  Xem tất cả (
                  {dailyReports.length})
                </button>
              </div>

              {loadingReports ? (
                <p className="text-sm text-slate-400 py-4 text-center">
                  Đang tải...
                </p>
              ) : dailyReports.length ===
                0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">
                  Chưa có báo cáo ngày nào.
                </p>
              ) : (
                <div className="space-y-2">
                  {dailyReports
                    .slice(0, 3)
                    .map((r, idx) => {
                      const imgs =
                        parseImageUrls(
                          r.progressImages
                        );

                      return (
                        <div
                          key={
                            r.id || idx
                          }
                          className="flex gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                              <span className="font-semibold text-slate-700">
                                #
                                {dailyReports.length -
                                  idx}
                              </span>

                              <span>·</span>

                              <span>
                                {r.reporterName ||
                                  "—"}
                              </span>

                              {r.createdAt && (
                                <>
                                  <span>
                                    ·
                                  </span>

                                  <span>
                                    {new Date(
                                      r.createdAt
                                    ).toLocaleString(
                                      "vi-VN",
                                      {
                                        day: "2-digit",
                                        month:
                                          "2-digit",
                                        hour: "2-digit",
                                        minute:
                                          "2-digit",
                                      }
                                    )}
                                  </span>
                                </>
                              )}

                              {r.progressPercentage !=
                                null && (
                                  <span className="ml-auto font-bold text-orange-600">
                                    {
                                      r.progressPercentage
                                    }
                                    %
                                  </span>
                                )}
                            </div>

                            <p className="text-sm text-slate-700 line-clamp-2">
                              {r.content ||
                                "Không có nội dung"}
                            </p>

                            {imgs.length >
                              0 && (
                                <p className="text-[11px] text-slate-400 mt-1">
                                  📷{" "}
                                  {imgs.length}{" "}
                                  ảnh
                                </p>
                              )}
                          </div>
                        </div>
                      );
                    })}

                  {dailyReports.length >
                    3 && (
                      <button
                        type="button"
                        onClick={() =>
                          setReportsModalOpen(
                            true
                          )
                        }
                        className="w-full text-xs text-slate-500 hover:text-slate-700 py-1"
                      >
                        +{" "}
                        {dailyReports.length -
                          3}{" "}
                        báo cáo khác
                      </button>
                    )}
                </div>
              )}
            </div>
          )}

          {/* =================================================
              TIMELINE
          ================================================== */}

          <OrderTimeline
            history={order.history || []}
          />
        </div>

        {/* ===================================================
            CỘT PHẢI
        ==================================================== */}

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm sticky top-4">
            <h3 className="font-bold text-slate-800 mb-4 pb-3 border-b border-slate-100">
              Hành động
            </h3>

            <div className="space-y-2.5">
              {/* =================================================
                  PHÂN CÔNG GIÁM SÁT
              ================================================== */}

              {canAssignSupervisor && (
                <ActionBtn
                  color="blue"
                  onClick={() => {
                    setSelectedId("");
                    setAssignModal(
                      "supervisor"
                    );
                  }}
                >
                  Phân công Giám sát khảo sát
                </ActionBtn>
              )}

              {/* =================================================
                  ĐANG KHẢO SÁT
              ================================================== */}

              {order.status ===
                "SURVEY_ASSIGNED" && (
                  <HintBox color="amber">
                    <strong>
                      Đang khảo sát.
                    </strong>{" "}
                    Giám sát đang thực hiện
                    khảo sát và sẽ gửi báo cáo
                    cho Admin.
                  </HintBox>
                )}

              {/* =================================================
                  LẬP HỢP ĐỒNG
              ================================================== */}

              {canCreateContract && (
                <>
                  <HintBox color="blue">
                    <strong>
                      Đã nhận báo cáo khảo sát.
                    </strong>{" "}
                    Admin có thể kiểm tra
                    kết quả khảo sát và lập
                    hợp đồng cho khách.
                  </HintBox>

                  <ActionBtn
                    color="indigo"
                    onClick={
                      handleOpenCreateContract
                    }
                  >
                    📜 Lập hợp đồng
                  </ActionBtn>
                </>
              )}

              {/* =================================================
                  HỢP ĐỒNG CHỜ DUYỆT
              ================================================== */}

              {order.status ===
                "WAITING_CONTRACT_APPROVAL" && (
                  <>
                    <HintBox color="indigo">
                      <strong>
                        HĐ chờ duyệt.
                      </strong>{" "}
                      Kiểm tra nội dung rồi
                      duyệt để gửi khách ký.

                      {surveySigned && (
                        <span className="block mt-1 text-emerald-700">
                          ✓ Giám sát đã ký
                        </span>
                      )}
                    </HintBox>

                    {canViewContract && (
                      <ActionBtn
                        color="indigo"
                        onClick={() =>
                          setContractModalOpen(
                            true
                          )
                        }
                      >
                        📜 Xem hợp đồng
                      </ActionBtn>
                    )}

                    {canApproveContract && (
                      <ActionBtn
                        color="emerald"
                        onClick={
                          handleApproveContract
                        }
                        disabled={approving}
                      >
                        {approving
                          ? "Đang duyệt..."
                          : "✅ Duyệt hợp đồng"}
                      </ActionBtn>
                    )}

                    {!contract && (
                      <p className="text-xs text-amber-600">
                        Chưa tải được HĐ.
                        Thử làm mới trang.
                      </p>
                    )}
                  </>
                )}

              {/* =================================================
                  CHỜ KHÁCH KÝ
              ================================================== */}

              {order.status ===
                "WAITING_CUSTOMER_SIGNATURE" && (
                  <>
                    <HintBox color="amber">
                      <strong>
                        Chờ khách ký.
                      </strong>{" "}
                      Đã duyệt HĐ, đang chờ
                      khách ký điện tử.
                    </HintBox>

                    {canViewContract && (
                      <ActionBtn
                        color="slate"
                        onClick={() =>
                          setContractModalOpen(
                            true
                          )
                        }
                      >
                        📜 Xem hợp đồng
                      </ActionBtn>
                    )}
                  </>
                )}

              {/* =================================================
                  KHÁCH ĐÃ KÝ
              ================================================== */}

              {order.status ===
                "CONTRACT_APPROVED" &&
                customerSigned && (
                  <>
                    <HintBox color="emerald">
                      <strong>
                        Khách đã ký.
                      </strong>{" "}
                      Có thể bàn giao / bắt
                      đầu thi công.
                    </HintBox>

                    {canViewContract && (
                      <ActionBtn
                        color="slate"
                        onClick={() =>
                          setContractModalOpen(
                            true
                          )
                        }
                      >
                        📜 Xem hợp đồng
                      </ActionBtn>
                    )}
                  </>
                )}

              {/* =================================================
                  THỢ TỪ CHỐI
              ================================================== */}

              {isWorkerRejected && (
                <HintBox color="red">
                  <strong>
                    Thợ từ chối.
                  </strong>{" "}
                  Gán đội thợ khác.
                </HintBox>
              )}

              {/* =================================================
                  GÁN THỢ
              ================================================== */}

              {canAssignWorker && (
                <ActionBtn
                  color="teal"
                  onClick={() => {
                    setSelectedId(
                      String(
                        preferredWorkerId ||
                        ""
                      )
                    );

                    setAssignModal("worker");
                  }}
                >
                  {isWorkerRejected ||
                    !hasTechnician
                    ? "Gán Đội thợ thi công"
                    : "Thay đổi / Gán lại Đội thợ"}
                </ActionBtn>
              )}

              {/* =================================================
                  ĐANG THI CÔNG
              ================================================== */}

              {order.status ===
                "PROCESSING" && (
                  <>
                    <HintBox color="blue">
                      <strong>
                        Đang thi công.
                      </strong>{" "}
                      Đội thợ cập nhật nhật ký
                      ngày.
                    </HintBox>

                    {canViewContract && (
                      <ActionBtn
                        color="slate"
                        onClick={() =>
                          setContractModalOpen(
                            true
                          )
                        }
                      >
                        📜 Xem hợp đồng
                      </ActionBtn>
                    )}
                  </>
                )}

              {/* =================================================
                  THỢ HOÀN THÀNH
              ================================================== */}

              {order.status ===
                "WORKER_COMPLETED" && (
                  <HintBox color="purple">
                    <strong>
                      Thợ hoàn thành.
                    </strong>{" "}
                    Chờ nghiệm thu / thanh toán.
                  </HintBox>
                )}

              {/* =================================================
                  THANH TOÁN NHÂN VIÊN
              ================================================== */}

              {canPayStaff && (
                <ActionBtn
                  color="emerald"
                  onClick={handlePayStaff}
                >
                  Xác nhận thanh toán tiền công
                </ActionBtn>
              )}

              {/* =================================================
                  BÁO CÁO NGÀY
              ================================================== */}

              {canViewDailyReports && (
                <ActionBtn
                  color="orange"
                  onClick={() => {
                    fetchDailyReports(id);
                    setReportsModalOpen(true);
                  }}
                >
                  📅 Báo cáo ngày (
                  {dailyReports.length})
                </ActionBtn>
              )}

              {/* =================================================
                  XEM HỢP ĐỒNG CHUNG
              ================================================== */}

              {canViewContract &&
                ![
                  "WAITING_CONTRACT_APPROVAL",
                  "WAITING_CUSTOMER_SIGNATURE",
                  "CONTRACT_APPROVED",
                  "PROCESSING",
                ].includes(
                  order.status
                ) && (
                  <ActionBtn
                    color="slate"
                    onClick={() =>
                      setContractModalOpen(
                        true
                      )
                    }
                  >
                    📜 Xem hợp đồng
                  </ActionBtn>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          MODAL PHÂN CÔNG NHÂN VIÊN
      ====================================================== */}

      <Modal
        isOpen={!!assignModal}
        onClose={() =>
          setAssignModal(null)
        }
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
                {assignModal ===
                  "supervisor"
                  ? "Giám sát"
                  : "Thợ"}{" "}
                khả dụng.
              </p>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/admin/employees"
                  )
                }
                className="px-3 py-1.5 bg-amber-600 text-white font-bold rounded-lg text-xs hover:bg-amber-700"
              >
                + Thêm nhân viên
              </button>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                {assignModal ===
                  "supervisor"
                  ? "Giám sát viên"
                  : "Đội thợ"}
              </label>

              <select
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                value={selectedId}
                onChange={(e) =>
                  setSelectedId(
                    e.target.value
                  )
                }
              >
                <option value="">
                  -- Chọn --
                </option>

                {currentList.map((s) => {
                  const sId = String(
                    s.userId || s.id
                  );

                  const isPreferred =
                    assignModal ===
                    "worker" &&
                    preferredWorkerId &&
                    String(
                      preferredWorkerId
                    ) === sId;

                  return (
                    <option
                      key={sId}
                      value={sId}
                    >
                      {s.fullName ||
                        s.username ||
                        `NV #${sId}`}

                      {isPreferred
                        ? " ★ (Khách chọn)"
                        : ""}

                      {s.specialty
                        ? ` – ${s.specialty}`
                        : ""}

                      {s.available === false
                        ? " (Bận)"
                        : ""}
                    </option>
                  );
                })}
              </select>

              {assignModal ===
                "worker" &&
                !customerSigned && (
                  <p className="text-[11px] text-amber-600 mt-2">
                    Gán sẵn. Chỉ sau khi
                    khách ký HĐ mới chính
                    thức bàn giao.
                  </p>
                )}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() =>
                setAssignModal(null)
              }
              className="flex-1 py-2 bg-slate-100 font-bold text-slate-600 rounded-xl text-sm hover:bg-slate-200"
            >
              Hủy
            </button>

            {currentList.length >
              0 && (
                <button
                  type="button"
                  onClick={
                    assignModal ===
                      "supervisor"
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

      {/* =====================================================
          MODAL XEM HỢP ĐỒNG
      ====================================================== */}

      <Modal
        isOpen={contractModalOpen}
        onClose={() =>
          setContractModalOpen(false)
        }
        title="Chi tiết hợp đồng"
      >
        {contract ? (
          <div className="space-y-4">
            {/* HEADER */}

            <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <span>
                Mã:{" "}
                {contract.contractCode ||
                  `HD-${contract.id}`}
              </span>

              <span
                className={
                  contract.customerSigned
                    ? "text-emerald-600"
                    : "text-amber-500"
                }
              >
                {contract.customerSigned
                  ? "Khách đã ký"
                  : "Chờ khách ký"}
              </span>
            </div>

            {/* STATUS */}

            <div className="flex flex-wrap gap-2 text-xs">
              <span
                className={
                  "px-2.5 py-1 rounded-full font-semibold " +
                  (surveySigned
                    ? "bg-blue-50 text-blue-700"
                    : "bg-slate-100 text-slate-500")
                }
              >
                {surveySigned
                  ? "✓ Giám sát đã ký"
                  : "○ Giám sát chưa ký"}
              </span>

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
                  : "○ Khách chưa ký"}
              </span>
            </div>

            {/* GIÁ */}

            <div className="grid grid-cols-3 gap-2">
              <MoneyBox
                label="Tổng"
                value={contract.totalAmount}
              />

              <MoneyBox
                label="Tiền cọc"
                value={
                  contract.depositAmount
                }
              />

              <MoneyBox
                label="Còn lại"
                value={
                  contract.remainingAmount
                }
              />
            </div>

            {/* CONTENT */}

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap min-h-[160px] max-h-[350px] overflow-y-auto">
              {contract.content ||
                "Chưa có nội dung"}
            </div>

            {/* SIGNATURE */}

            {(surveySignatureImg ||
              contract.customerSignatureImg) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* GIÁM SÁT */}

                  {surveySignatureImg && (
                    <div className="border border-blue-100 rounded-xl p-3 bg-blue-50/40">
                      <p className="text-[10px] font-bold text-blue-700 uppercase mb-2 tracking-wide">
                        Chữ ký Giám sát /
                        Khảo sát viên
                      </p>

                      <div className="bg-white rounded-lg border border-blue-100 p-2 flex items-center justify-center min-h-[80px]">
                        <img
                          src={
                            surveySignatureImg
                          }
                          alt="Chữ ký giám sát"
                          className="max-h-28 max-w-full object-contain"
                        />
                      </div>

                      {surveySignedAt && (
                        <p className="text-[10px] text-slate-500 mt-1.5">
                          Ký lúc:{" "}
                          {new Date(
                            surveySignedAt
                          ).toLocaleString(
                            "vi-VN"
                          )}
                        </p>
                      )}
                    </div>
                  )}

                  {/* KHÁCH */}

                  {contract.customerSignatureImg && (
                    <div className="border border-emerald-100 rounded-xl p-3 bg-emerald-50/40">
                      <p className="text-[10px] font-bold text-emerald-700 uppercase mb-2 tracking-wide">
                        Chữ ký khách hàng
                      </p>

                      <div className="bg-white rounded-lg border border-emerald-100 p-2 flex items-center justify-center min-h-[80px]">
                        <img
                          src={
                            contract.customerSignatureImg
                          }
                          alt="Chữ ký khách"
                          className="max-h-28 max-w-full object-contain"
                        />
                      </div>

                      {contract.customerSignedAt && (
                        <p className="text-[10px] text-slate-500 mt-1.5">
                          Ký lúc:{" "}
                          {new Date(
                            contract.customerSignedAt
                          ).toLocaleString(
                            "vi-VN"
                          )}
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

      {/* =====================================================
          MODAL BÁO CÁO NGÀY
      ====================================================== */}

      <Modal
        isOpen={reportsModalOpen}
        onClose={() =>
          setReportsModalOpen(false)
        }
        title={`Tất cả báo cáo tiến độ (${dailyReports.length})`}
      >
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
          {dailyReports.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">
              Chưa có báo cáo ngày nào.
            </p>
          ) : (
            dailyReports.map((r, idx) => {
              const imgs =
                parseImageUrls(
                  r.progressImages
                );

              return (
                <div
                  key={r.id || idx}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 text-sm space-y-2"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-bold text-slate-800">
                      #
                      {dailyReports.length -
                        idx}{" "}
                      -{" "}
                      {r.reporterName ||
                        "N/A"}
                    </span>

                    {r.progressPercentage !=
                      null && (
                        <span className="font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">
                          {
                            r.progressPercentage
                          }
                          %
                        </span>
                      )}
                  </div>

                  <p className="text-slate-700 whitespace-pre-line">
                    {r.content ||
                      "Không có nội dung"}
                  </p>

                  {imgs.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      {imgs.map(
                        (url, i) => (
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
                        )
                      )}
                    </div>
                  )}

                  {r.createdAt && (
                    <p className="text-[10px] text-slate-400 text-right">
                      {new Date(
                        r.createdAt
                      ).toLocaleString(
                        "vi-VN"
                      )}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Modal>

      {/* =====================================================
          MODAL LẬP HỢP ĐỒNG
      ====================================================== */}

      <CreateContractModal
        isOpen={createContractModalOpen}
        onClose={() =>
          setCreateContractModalOpen(false)
        }
        order={order}
        bookingDetails={bookingDetails}
        showToast={showToast}
        onSuccess={
          handleContractCreated
        }
      />
    </div>
  );
}

/* ===========================================================
   INFO ITEM
=========================================================== */

function InfoItem({
  label,
  value,
  highlight = false,
}) {
  return (
    <div>
      <p className="text-[11px] font-bold text-slate-400 uppercase mb-0.5">
        {label}
      </p>

      <p
        className={`text-sm ${highlight
          ? "font-semibold text-blue-600"
          : "text-slate-800"
          }`}
      >
        {value}
      </p>
    </div>
  );
}

/* ===========================================================
   MONEY BOX
=========================================================== */

function MoneyBox({
  label,
  value,
}) {
  return (
    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
      <p className="text-[10px] font-bold uppercase text-slate-400">
        {label}
      </p>

      <p className="text-sm font-bold text-slate-800 mt-1">
        {value == null || value === ""
          ? "—"
          : Number(value).toLocaleString(
            "vi-VN"
          ) + " đ"}
      </p>
    </div>
  );
}

/* ===========================================================
   ACTION BUTTON
=========================================================== */

function ActionBtn({
  children,
  color,
  onClick,
  disabled = false,
}) {
  const colorMap = {
    blue:
      "bg-blue-600 hover:bg-blue-700 text-white",

    teal:
      "bg-teal-600 hover:bg-teal-700 text-white",

    indigo:
      "bg-indigo-600 hover:bg-indigo-700 text-white",

    emerald:
      "bg-emerald-600 hover:bg-emerald-700 text-white",

    orange:
      "bg-orange-600 hover:bg-orange-700 text-white",

    slate:
      "bg-slate-700 hover:bg-slate-800 text-white",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-2.5 px-4 rounded-xl font-bold text-sm transition shadow-sm disabled:opacity-50 ${colorMap[color] ||
        colorMap.slate
        }`}
    >
      {children}
    </button>
  );
}

/* ===========================================================
   HINT BOX
=========================================================== */

function HintBox({
  children,
  color,
}) {
  const colorMap = {
    amber:
      "bg-amber-50 border-amber-200 text-amber-800",

    indigo:
      "bg-indigo-50 border-indigo-200 text-indigo-800",

    emerald:
      "bg-emerald-50 border-emerald-200 text-emerald-800",

    blue:
      "bg-blue-50 border-blue-200 text-blue-800",

    red:
      "bg-red-50 border-red-200 text-red-800",

    purple:
      "bg-purple-50 border-purple-200 text-purple-800",
  };

  return (
    <div
      className={`p-3 rounded-xl border text-xs leading-relaxed ${colorMap[color] ||
        colorMap.amber
        }`}
    >
      {children}
    </div>
  );
}