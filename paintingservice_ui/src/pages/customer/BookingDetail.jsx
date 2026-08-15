// import { useState, useEffect } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import AxiosConfig from "../../util/AxiosConfig";
// import StatusBadge from "../../components/common/StatusBadge";
// import PaymentSection from "../../components/payment/PaymentSection";

// function BookingDetail({ user, showToast }) {
//   const { id } = useParams();
//   const navigate = useNavigate();

//   const [booking, setBooking] = useState(null);
//   const [loading, setLoading] = useState(true);

//   const fetchBooking = async () => {
//     try {
//       const res = await AxiosConfig.get(`/bookings/${id}`);
//       setBooking(res.data);
//     } catch (error) {
//       console.error(error);
//       showToast?.("Không tải được thông tin đơn hàng", "error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (!user) {
//       navigate("/login");
//       return;
//     }

//     setLoading(true);
//     fetchBooking();
//   }, [id, user, navigate, showToast]);

//   const formatDate = (dateInput) => {
//     if (Array.isArray(dateInput)) {
//       const [year, month, day] = dateInput;
//       return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
//     }
//     return dateInput || "—";
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-slate-50 flex items-center justify-center">
//         <div className="text-slate-500 font-medium">Đang tải chi tiết đơn...</div>
//       </div>
//     );
//   }

//   if (!booking) return null;

//   return (
//     <div className="min-h-screen bg-slate-50 text-slate-800">
//       <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
//         <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
//           <button
//             onClick={() => navigate("/home")}
//             className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600"
//           >
//             ← Quay lại
//           </button>
//           <h1 className="text-lg font-black text-slate-900">
//             Chi tiết đơn #{booking.id}
//           </h1>
//           <div className="w-20" />
//         </div>
//       </header>

//       <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
//         <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
//           <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
//             <div>
//               <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
//                 Trạng thái hiện tại
//               </div>
//               <StatusBadge status={booking.status} />
//             </div>
//             <div className="text-right">
//               <div className="text-xs text-slate-400">Ngày tạo</div>
//               <div className="font-semibold">
//                 {formatDate(booking.createdAt || booking.appointmentDate)}
//               </div>
//             </div>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             <div>
//               <h3 className="text-sm font-bold text-slate-500 mb-2">
//                 Thông tin công trình
//               </h3>
//               <div className="space-y-2 text-sm">
//                 <p>
//                   <span className="text-slate-400">Hạng mục:</span>{" "}
//                   <span className="font-semibold">
//                     {booking.serviceName || booking.service?.name || "—"}
//                   </span>
//                 </p>
//                 <p>
//                   <span className="text-slate-400">Địa chỉ:</span>{" "}
//                   <span className="font-semibold">{booking.address || "—"}</span>
//                 </p>
//                 <p>
//                   <span className="text-slate-400">Ngày hẹn:</span>{" "}
//                   <span className="font-semibold">
//                     {formatDate(booking.appointmentDate)}{" "}
//                     {booking.appointmentTime || ""}
//                   </span>
//                 </p>
//                 <p>
//                   <span className="text-slate-400">Kỹ thuật viên:</span>{" "}
//                   <span className="font-semibold text-blue-600">
//                     {booking.technicianName ||
//                       booking.preferredTechnicianName ||
//                       "Chưa phân công"}
//                   </span>
//                 </p>
//               </div>
//             </div>

//             <div>
//               <h3 className="text-sm font-bold text-slate-500 mb-2">
//                 Mô tả yêu cầu
//               </h3>
//               <p className="text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed whitespace-pre-wrap">
//                 {booking.description || "Không có mô tả"}
//               </p>
//             </div>
//           </div>
//         </div>

//         <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
//           <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
//             💰 Thông tin thanh toán
//           </h3>
//           <PaymentSection booking={booking} showToast={showToast} onRefresh={fetchBooking} />
//         </div>

//         {booking.notes && (
//           <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
//             <h3 className="text-sm font-bold text-slate-500 mb-2">Ghi chú</h3>
//             <p className="text-sm text-slate-700 whitespace-pre-wrap">
//               {booking.notes}
//             </p>
//           </div>
//         )}
//       </main>
//     </div>
//   );
// }

// export default BookingDetail;




import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AxiosConfig from "../../util/AxiosConfig";
import StatusBadge from "../../components/common/StatusBadge";
import PaymentSection from "../../components/payment/PaymentSection";
import Modal from "../../components/common/Modal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import LoadingSpinner from "../../components/common/LoadingSpinner";

function formatDate(dateInput) {
  if (Array.isArray(dateInput)) {
    const [year, month, day] = dateInput;

    return `${year}-${String(month).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
  }

  if (!dateInput) return "—";

  return String(dateInput).split("T")[0];
}

function formatMoney(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const number = Number(value);

  if (Number.isNaN(number)) return value;

  return new Intl.NumberFormat("vi-VN").format(number) + " đ";
}

/* -------------------------------------------------------------------------- */
/* Contract Modal                                                             */
/* -------------------------------------------------------------------------- */

function ContractModal({
  isOpen,
  onClose,
  contract,
  bookingStatus,
  showToast,
  onSuccess,
}) {
  const canvasRef = useRef(null);

  const [isDrawing, setIsDrawing] = useState(false);

  const canSignContract =
    contract &&
    !contract.customerSigned &&
    bookingStatus === "WAITING_CUSTOMER_SIGNATURE";

  const isWaitingAdminApproval =
    contract &&
    !contract.customerSigned &&
    bookingStatus === "WAITING_CONTRACT_APPROVAL";

  const getCanvasPosition = (event) => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return { x: 0, y: 0 };
    }

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

    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2;
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

    ctx.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );
  };

  const handleConfirm = async () => {
    const canvas = canvasRef.current;

    if (!canvas || !contract?.id) return;

    const ctx = canvas.getContext("2d");

    const pixels = ctx.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    ).data;

    const hasInk = pixels.some(
      (value, index) =>
        index % 4 === 3 && value > 0
    );

    if (!hasInk) {
      showToast(
        "Vui lòng ký tên trước khi xác nhận!",
        "warning"
      );

      return;
    }

    const signatureBase64 =
      canvas.toDataURL("image/png");

    try {
      const payload = {
        id: contract.id,
        bookingId: contract.bookingId,
        contractCode: contract.contractCode,
        content: contract.content,

        customerSigned: true,
        customerSignatureImg: signatureBase64,

        workerSigned: contract.workerSigned ?? false,
        workerSignatureImg:
          contract.workerSignatureImg ?? null,
      };

      await AxiosConfig.put(
        `/contracts/${contract.id}`,
        payload
      );

      showToast("Ký hợp đồng thành công!");

      onSuccess?.();
      onClose?.();
    } catch (error) {
      console.error("Sign contract error:", error);

      const message =
        error.response?.data?.message ||
        error.response?.data?.messages?.join?.(" ") ||
        "Không thể ký hợp đồng!";

      showToast(message, "error");
    }
  };

  if (!isOpen || !contract) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Hợp đồng dịch vụ"
    >
      <div className="space-y-5">
        {/* Contract header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Mã hợp đồng
            </div>

            <div className="text-lg font-black text-slate-800">
              {contract.contractCode || "—"}
            </div>
          </div>

          <div>
            {contract.customerSigned ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-black">
                ✓ Đã ký
              </span>
            ) : bookingStatus ===
              "WAITING_CONTRACT_APPROVAL" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-600 text-xs font-black">
                ⏳ Chờ Admin duyệt
              </span>
            ) : bookingStatus ===
              "WAITING_CUSTOMER_SIGNATURE" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-black">
                ✍️ Chờ bạn ký
              </span>
            ) : null}
          </div>
        </div>

        {/* Contract content */}
        <div>
          <div className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
            Nội dung hợp đồng
          </div>

          <div className="p-4 sm:p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-700 leading-relaxed whitespace-pre-wrap max-h-[320px] overflow-y-auto">
            {contract.content || "Chưa có nội dung hợp đồng."}
          </div>
        </div>

        {/* Signatures */}
        {(contract.workerSignatureImg ||
          (contract.customerSigned &&
            contract.customerSignatureImg)) && (
            <div>
              <div className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">
                Chữ ký
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {contract.workerSignatureImg && (
                  <div className="border border-blue-100 bg-blue-50/40 rounded-2xl p-4">
                    <div className="text-[10px] font-black uppercase tracking-wider text-blue-600 mb-2">
                      Giám sát / Thợ
                    </div>

                    <div className="h-24 bg-white rounded-xl flex items-center justify-center border border-blue-100">
                      <img
                        src={contract.workerSignatureImg}
                        alt="Chữ ký nhân sự"
                        className="max-h-20 max-w-full object-contain"
                      />
                    </div>
                  </div>
                )}

                {contract.customerSigned &&
                  contract.customerSignatureImg && (
                    <div className="border border-emerald-100 bg-emerald-50/40 rounded-2xl p-4">
                      <div className="text-[10px] font-black uppercase tracking-wider text-emerald-600 mb-2">
                        Khách hàng
                      </div>

                      <div className="h-24 bg-white rounded-xl flex items-center justify-center border border-emerald-100">
                        <img
                          src={contract.customerSignatureImg}
                          alt="Chữ ký khách hàng"
                          className="max-h-20 max-w-full object-contain"
                        />
                      </div>
                    </div>
                  )}
              </div>
            </div>
          )}

        {/* Waiting admin */}
        {isWaitingAdminApproval && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
            <div className="font-bold text-amber-800 text-sm">
              Hợp đồng đang chờ Admin duyệt
            </div>

            <p className="text-xs text-amber-700 mt-1">
              Bạn có thể ký hợp đồng sau khi Admin phê duyệt.
            </p>
          </div>
        )}

        {/* Customer signature */}
        {canSignContract && (
          <div className="border-t border-slate-100 pt-5">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-sm font-black text-slate-800">
                  Xác nhận chữ ký
                </div>

                <div className="text-xs text-slate-400 mt-0.5">
                  Dùng chuột hoặc màn hình cảm ứng để ký.
                </div>
              </div>

              <button
                type="button"
                onClick={clearSignature}
                className="text-xs font-bold text-rose-500 hover:underline"
              >
                Xóa
              </button>
            </div>

            <div className="border-2 border-dashed border-slate-200 rounded-2xl bg-white overflow-hidden">
              <canvas
                ref={canvasRef}
                width={600}
                height={180}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className="w-full h-[160px] sm:h-[180px] cursor-crosshair touch-none"
              />
            </div>

            <button
              type="button"
              onClick={handleConfirm}
              className="
                w-full
                mt-4
                py-3
                rounded-xl
                bg-blue-600
                hover:bg-blue-700
                text-white
                font-black
                text-sm
                shadow-lg
                shadow-blue-600/20
                transition
                active:scale-[0.99]
              "
            >
              ✍️ Xác nhận & ký hợp đồng
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* Booking Detail                                                             */
/* -------------------------------------------------------------------------- */

export default function BookingDetail({
  user,
  showToast,
}) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [contract, setContract] = useState(null);

  const [loading, setLoading] = useState(true);
  const [contractLoading, setContractLoading] =
    useState(false);

  const [contractModal, setContractModal] =
    useState(false);

  const [confirmDialog, setConfirmDialog] =
    useState(null);

  const fetchBooking = async () => {
    try {
      const response = await AxiosConfig.get(
        `/bookings/${id}`
      );

      setBooking(response.data);
    } catch (error) {
      console.error("Load booking detail error:", error);

      showToast?.(
        error.response?.data?.message ||
        "Không tải được thông tin đơn hàng!",
        "error"
      );
    }
  };

  const fetchContract = async () => {
    setContractLoading(true);

    try {
      const response = await AxiosConfig.get(
        "/contracts"
      );

      const contracts = Array.isArray(response.data)
        ? response.data
        : [];

      const found = contracts.find(
        (item) =>
          Number(item.bookingId) === Number(id)
      );

      setContract(found || null);
    } catch (error) {
      console.error("Load contract error:", error);
      setContract(null);
    } finally {
      setContractLoading(false);
    }
  };

  const refreshData = async () => {
    await Promise.all([
      fetchBooking(),
      fetchContract(),
    ]);
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
  }, [id, user, navigate]);

  const handleCustomerAccept = () => {
    setConfirmDialog({
      title: "Nghiệm thu công trình",
      message:
        "Xác nhận bạn đã nghiệm thu công trình?\n\nSau khi xác nhận, hệ thống sẽ ghi nhận nghiệm thu cho các hạng mục chưa được xác nhận.",
      onConfirm: async () => {
        try {
          const response = await AxiosConfig.get(
            `/booking-details/booking/${id}`
          );

          const details = Array.isArray(response.data)
            ? response.data
            : [];

          if (!details.length) {
            throw new Error(
              "Đơn hàng chưa có hạng mục để nghiệm thu."
            );
          }

          const pending = details.filter(
            (detail) => !detail.customerAccepted
          );

          if (!pending.length) {
            showToast?.(
              "Các hạng mục đã được nghiệm thu!",
              "info"
            );

            setConfirmDialog(null);
            return;
          }

          await Promise.all(
            pending.map((detail) =>
              AxiosConfig.post(
                `/booking-details/${detail.id}/customer-accept`
              )
            )
          );

          showToast?.(
            "Đã nghiệm thu công trình thành công!"
          );

          await fetchBooking();
        } catch (error) {
          console.error(error);

          showToast?.(
            error.response?.data?.message ||
            error.message ||
            "Không thể nghiệm thu công trình!",
            "error"
          );
        } finally {
          setConfirmDialog(null);
        }
      },
    });
  };

  const getTechnicianName = () => {
    return (
      booking?.technicianName ||
      booking?.preferredTechnicianName ||
      "Chưa phân công"
    );
  };

  const getServiceName = () => {
    return (
      booking?.serviceName ||
      booking?.service?.name ||
      "Dịch vụ sửa chữa"
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!booking) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-3">📋</div>

          <h2 className="font-bold text-slate-800">
            Không tìm thấy đơn hàng
          </h2>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const canCustomerAccept =
    booking.status === "WORKER_COMPLETED" &&
    !booking.customerAccepted;

  const isContractRelevant = [
    "WAITING_CONTRACT_APPROVAL",
    "WAITING_CUSTOMER_SIGNATURE",
    "ASSIGNED",
    "PROCESSING",
    "WORKER_COMPLETED",
    "COMPLETED",
  ].includes(booking.status);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="
                flex items-center gap-2
                px-3 py-2
                rounded-xl
                text-sm
                font-bold
                text-slate-600
                hover:bg-slate-100
                transition
              "
            >
              ←
              <span className="hidden sm:inline">
                Quay lại
              </span>
            </button>

            <div className="text-center">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-black">
                Chi tiết yêu cầu
              </div>

              <div className="font-black text-slate-900">
                #{booking.id}
              </div>
            </div>

            <div className="w-16 sm:w-24" />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-5 space-y-4">
        {/* Overview */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-black text-blue-600">
                    YÊU CẦU #{booking.id}
                  </span>

                  {booking.createdAt && (
                    <span className="text-xs text-slate-400">
                      • {formatDate(booking.createdAt)}
                    </span>
                  )}
                </div>

                <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                  {getServiceName()}
                </h1>

                <p className="text-sm text-slate-500 mt-1">
                  Theo dõi toàn bộ quá trình xử lý công trình
                </p>
              </div>

              <StatusBadge status={booking.status} />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 border-t border-slate-100">
            <div className="p-4 border-r border-b md:border-b-0 border-slate-100">
              <div className="text-[10px] font-black uppercase text-slate-400">
                Ngày hẹn
              </div>

              <div className="mt-1 text-sm font-bold text-slate-800">
                {formatDate(booking.appointmentDate)}
              </div>
            </div>

            <div className="p-4 md:border-r border-b md:border-b-0 border-slate-100">
              <div className="text-[10px] font-black uppercase text-slate-400">
                Thời gian
              </div>

              <div className="mt-1 text-sm font-bold text-slate-800">
                {booking.appointmentTime || "—"}
              </div>
            </div>

            <div className="p-4 border-r border-slate-100">
              <div className="text-[10px] font-black uppercase text-slate-400">
                Nhân sự
              </div>

              <div className="mt-1 text-sm font-bold text-blue-600 truncate">
                {getTechnicianName()}
              </div>
            </div>

            <div className="p-4">
              <div className="text-[10px] font-black uppercase text-slate-400">
                Tổng tiền
              </div>

              <div className="mt-1 text-sm font-black text-emerald-600">
                {formatMoney(
                  booking.totalAmount ??
                  booking.totalPrice ??
                  booking.price
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Project information */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
          <div className="mb-4">
            <h2 className="font-black text-slate-900">
              Thông tin công trình
            </h2>

            <p className="text-xs text-slate-400 mt-1">
              Thông tin địa điểm và nhân sự thực hiện
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                Dịch vụ
              </div>

              <div className="text-sm font-bold text-slate-800">
                {getServiceName()}
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                Địa chỉ
              </div>

              <div className="text-sm font-bold text-slate-800">
                {booking.address || "Chưa có địa chỉ"}
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                Kỹ thuật viên / Thợ
              </div>

              <div className="text-sm font-bold text-blue-600">
                {getTechnicianName()}
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                Ngày tạo
              </div>

              <div className="text-sm font-bold text-slate-800">
                {formatDate(
                  booking.createdAt ||
                  booking.appointmentDate
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Description */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
          <h2 className="font-black text-slate-900 mb-3">
            Mô tả yêu cầu
          </h2>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {booking.description ||
              "Khách hàng không cung cấp mô tả."}
          </div>
        </section>

        {/* Contract */}
        {isContractRelevant && (
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="font-black text-slate-900">
                    Hợp đồng dịch vụ
                  </h2>

                  <p className="text-xs text-slate-400 mt-1">
                    Xem và ký hợp đồng của yêu cầu này
                  </p>
                </div>

                {contractLoading ? (
                  <span className="text-xs text-slate-400">
                    Đang tải...
                  </span>
                ) : contract ? (
                  <button
                    type="button"
                    onClick={() =>
                      setContractModal(true)
                    }
                    className="
                      px-4 py-2.5
                      rounded-xl
                      bg-emerald-50
                      text-emerald-600
                      hover:bg-emerald-100
                      text-xs
                      font-black
                      transition
                    "
                  >
                    📜{" "}
                    {booking.status ===
                      "WAITING_CUSTOMER_SIGNATURE"
                      ? "Ký hợp đồng"
                      : "Xem hợp đồng"}
                  </button>
                ) : (
                  <span className="text-xs font-medium text-slate-400">
                    Chưa có hợp đồng
                  </span>
                )}
              </div>

              {contract && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50">
                    <div className="text-[10px] uppercase font-black text-slate-400">
                      Mã hợp đồng
                    </div>

                    <div className="text-sm font-bold mt-1">
                      {contract.contractCode || "—"}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50">
                    <div className="text-[10px] uppercase font-black text-slate-400">
                      Nhân sự ký
                    </div>

                    <div className="text-sm font-bold mt-1">
                      {contract.workerSigned
                        ? "Đã ký ✓"
                        : "Chưa ký"}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50">
                    <div className="text-[10px] uppercase font-black text-slate-400">
                      Khách hàng ký
                    </div>

                    <div
                      className={`text-sm font-bold mt-1 ${contract.customerSigned
                        ? "text-emerald-600"
                        : "text-amber-500"
                        }`}
                    >
                      {contract.customerSigned
                        ? "Đã ký ✓"
                        : "Chưa ký"}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Payment */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
          <div className="mb-4">
            <h2 className="font-black text-slate-900">
              Thanh toán
            </h2>

            <p className="text-xs text-slate-400 mt-1">
              Theo dõi và thực hiện thanh toán cho đơn hàng
            </p>
          </div>

          <PaymentSection
            booking={booking}
            showToast={showToast}
            onRefresh={fetchBooking}
          />
        </section>

        {/* Acceptance */}
        {booking.status === "WORKER_COMPLETED" && (
          <section
            className={`rounded-2xl border shadow-sm p-5 ${booking.customerAccepted
              ? "bg-emerald-50 border-emerald-200"
              : "bg-purple-50 border-purple-200"
              }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2
                  className={`font-black ${booking.customerAccepted
                    ? "text-emerald-800"
                    : "text-purple-800"
                    }`}
                >
                  {booking.customerAccepted
                    ? "Đã nghiệm thu công trình ✓"
                    : "Công trình chờ nghiệm thu"}
                </h2>

                <p
                  className={`text-xs mt-1 ${booking.customerAccepted
                    ? "text-emerald-700"
                    : "text-purple-700"
                    }`}
                >
                  {booking.customerAccepted
                    ? "Bạn đã xác nhận hoàn thành công trình."
                    : "Kiểm tra công trình trước khi xác nhận nghiệm thu."}
                </p>
              </div>

              {canCustomerAccept && (
                <button
                  type="button"
                  onClick={handleCustomerAccept}
                  className="
                    px-5 py-3
                    rounded-xl
                    bg-purple-600
                    hover:bg-purple-700
                    text-white
                    text-sm
                    font-black
                    shadow-lg
                    shadow-purple-600/20
                    transition
                  "
                >
                  ✓ Xác nhận nghiệm thu
                </button>
              )}
            </div>
          </section>
        )}

        {/* Notes */}
        {booking.notes && (
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
            <h2 className="font-black text-slate-900 mb-3">
              Ghi chú
            </h2>

            <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-sm text-slate-700 whitespace-pre-wrap">
              {booking.notes}
            </div>
          </section>
        )}

        {/* Bottom back */}
        <div className="flex justify-center pt-2 pb-5">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="
              px-5 py-2.5
              rounded-xl
              bg-white
              border border-slate-200
              text-sm
              font-bold
              text-slate-600
              hover:bg-slate-50
              transition
            "
          >
            ← Quay lại danh sách yêu cầu
          </button>
        </div>
      </main>

      {/* Contract modal */}
      <ContractModal
        isOpen={contractModal}
        onClose={() => setContractModal(false)}
        contract={contract}
        bookingStatus={booking.status}
        showToast={showToast}
        onSuccess={async () => {
          await Promise.all([
            fetchBooking(),
            fetchContract(),
          ]);
        }}
      />

      {/* Confirm */}
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
