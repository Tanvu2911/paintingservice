// import { useState } from "react";
// import AxiosConfig from "../../util/AxiosConfig";
// import { formatMoney } from "../../util/formatters";
// import Modal from "../common/Modal";
// import QRCodePayment from "../common/QRCodePayment";
// import DepositPaymentProofModal from "./DepositPaymentProofModal";
// import DepositCountdownBadge from "./DepositCountdownBadge";

// export function getPaymentState(booking) {
//   if (!booking) return { canPayDeposit: false, canPayFinal: false };

//   const isDepositPaid =
//     booking.depositPaid ||
//     booking.paymentStatus === "DEPOSIT_PAID" ||
//     booking.paymentStatus === "FULLY_PAID";

//   const isFinalPaid =
//     booking.finalPaid || booking.paymentStatus === "FULLY_PAID";

//   const isCancelled = booking.status === "CANCELLED";

//   const canPayDeposit =
//     !isDepositPaid &&
//     !isCancelled &&
//     [
//       "PENDING",
//       "SURVEY_ASSIGNED",
//       "WAITING_CUSTOMER_SIGNATURE",
//       "ASSIGNED",
//       "PROCESSING",
//       "CONTRACT_APPROVED",
//     ].includes(booking.status);

//   const canPayFinal =
//     isDepositPaid &&
//     !isFinalPaid &&
//     !isCancelled &&
//     ["WORKER_COMPLETED", "COMPLETED", "WAITING_FINAL_PAYMENT"].includes(
//       booking.status
//     );

//   return { canPayDeposit, canPayFinal, isDepositPaid, isFinalPaid, isCancelled };
// }

// export default function PaymentSection({ booking, showToast, onRefresh, compact = false }) {
//   const [paying, setPaying] = useState(false);
//   const [openDepositModal, setOpenDepositModal] = useState(false);
//   const [openFinalQrModal, setOpenFinalQrModal] = useState(false);

//   const { canPayDeposit, canPayFinal, isDepositPaid, isFinalPaid, isCancelled } = getPaymentState(booking);

//   const depositAmount =
//     booking?.depositAmount && Number(booking.depositAmount) > 0
//       ? Number(booking.depositAmount)
//       : (Number(booking?.totalAmount) || 0) * 0.3;

//   const remainingAmount =
//     booking?.remainingAmount && Number(booking.remainingAmount) > 0
//       ? Number(booking.remainingAmount)
//       : Math.max(0, (Number(booking?.totalAmount) || 0) - depositAmount);

//   const isPendingConfirmation = booking?.paymentStatus === "PENDING_CONFIRMATION";

//   // Xử lý nộp ảnh chuyển khoản cọc
//   const handleDepositProofSubmit = async ({ image, note }) => {
//     if (!booking) return;

//     try {
//       setPaying(true);

//       const formData = new FormData();
//       formData.append("bookingId", booking.id);
//       formData.append("paymentType", "DEPOSIT");
//       if (note) formData.append("note", note);
//       if (image) {
//         formData.append("proofImage", image); // tên field phải khớp backend
//       }

//       const res = await AxiosConfig.post("/payments/qr-submit", formData, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });

//       showToast?.(
//         res.data?.message ||
//         "Đã gửi ảnh thanh toán cọc thành công! Vui lòng chờ Admin xác nhận.",
//         "success"
//       );

//       // Đóng modal + refresh để hiện banner "Chờ Admin"
//       setOpenDepositModal(false);
//       if (onRefresh) onRefresh();
//     } catch (error) {
//       const msg =
//         error.response?.data?.message ||
//         error.response?.data?.messages?.join?.(", ") ||
//         "Lỗi khi gửi xác nhận thanh toán";
//       showToast?.(msg, "error");
//       throw error; // để modal hiện errorMsg
//     } finally {
//       setPaying(false);
//     }
//   };

//   // Xử lý nộp thanh toán phần còn lại (FINAL)
//   const handleFinalPaymentSubmit = async () => {
//     if (!booking) return;
//     try {
//       setPaying(true);
//       const res = await AxiosConfig.post(
//         `/payments/qr-submit?bookingId=${booking.id}&paymentType=FINAL`
//       );
//       showToast?.(
//         res.data?.message || "Đã gửi thông tin tất toán! Vui lòng chờ Admin xác nhận.",
//         "success"
//       );
//       setOpenFinalQrModal(false);
//       if (onRefresh) onRefresh();
//     } catch (error) {
//       const msg =
//         error.response?.data?.message || "Lỗi khi gửi xác nhận thanh toán";
//       showToast?.(msg, "error");
//     } finally {
//       setPaying(false);
//     }
//   };

//   if (!booking) return null;

//   return (
//     <div className={compact ? "space-y-3" : "space-y-4"}>
//       {/* Countdown 24h nếu chưa đóng cọc */}
//       {!isDepositPaid && !isCancelled && (
//         <DepositCountdownBadge
//           signedAt={booking.createdAt || booking.appointmentDate}
//           deadline={booking.depositDeadline}
//           isDepositPaid={isDepositPaid}
//           isCancelled={isCancelled}
//         />
//       )}

//       {/* Banner chờ duyệt */}
//       {isPendingConfirmation && (
//         <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-center gap-2.5">
//           <span className="text-lg animate-spin">⏳</span>
//           <div>
//             <p className="font-bold">Đang chờ Admin kiểm tra và xác nhận chuyển khoản</p>
//             <p className="text-[11px] text-amber-600">
//               Bạn đã gửi ảnh/biên lai chuyển khoản. Đội thi công sẽ được bàn giao ngay khi Admin duyệt cọc.
//             </p>
//           </div>
//         </div>
//       )}

//       {/* Bảng tóm tắt số tiền */}
//       <div className={`grid grid-cols-1 ${compact ? "sm:grid-cols-3" : "sm:grid-cols-3"} gap-3`}>
//         <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
//           <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">
//             Tổng giá trị HĐ
//           </div>
//           <div className="text-base font-black text-slate-800">
//             {formatMoney(booking.totalAmount || booking.service?.basePrice)}
//           </div>
//         </div>

//         <div className="bg-blue-50/60 rounded-xl p-3 text-center border border-blue-100">
//           <div className="text-[10px] text-blue-600 font-bold uppercase mb-1">
//             Phí cọc (24h)
//           </div>
//           <div className="text-base font-black text-blue-700">
//             {formatMoney(depositAmount)}
//           </div>
//           <div className="text-[10px] mt-1 font-semibold">
//             {isDepositPaid ? (
//               <span className="text-emerald-600">Đã thanh toán ✓</span>
//             ) : isPendingConfirmation ? (
//               <span className="text-amber-600">Chờ duyệt ⏳</span>
//             ) : (
//               <span className="text-rose-500">Chưa cọc</span>
//             )}
//           </div>
//         </div>

//         <div className="bg-emerald-50/60 rounded-xl p-3 text-center border border-emerald-100">
//           <div className="text-[10px] text-emerald-600 font-bold uppercase mb-1">
//             Còn lại sau hoàn thành
//           </div>
//           <div className="text-base font-black text-emerald-700">
//             {formatMoney(remainingAmount)}
//           </div>
//           <div className="text-[10px] mt-1 font-semibold">
//             {isFinalPaid ? (
//               <span className="text-emerald-600">Đã thanh toán ✓</span>
//             ) : isDepositPaid && isPendingConfirmation ? (
//               <span className="text-amber-600">Chờ duyệt ⏳</span>
//             ) : (
//               <span className="text-slate-500">Chưa thanh toán</span>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Buttons */}
//       <div className="flex flex-col sm:flex-row gap-2.5">
//         {canPayDeposit && (
//           <button
//             type="button"
//             onClick={() => setOpenDepositModal(true)}
//             disabled={paying}
//             className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-blue-600/20"
//           >
//             <span>📱 Quét VietQR &amp; Gửi ảnh chuyển cọc (24h)</span>
//           </button>
//         )}

//         {canPayFinal && (
//           <button
//             type="button"
//             onClick={() => setOpenFinalQrModal(true)}
//             disabled={paying}
//             className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
//           >
//             <span>📱 Quét VietQR thanh toán phần còn lại</span>
//           </button>
//         )}

//         {!canPayDeposit && !canPayFinal && (
//           <div className="w-full text-center py-2.5 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl">
//             {isFinalPaid
//               ? "Đã hoàn tất thanh toán 100% ✓"
//               : isDepositPaid
//                 ? "Đã cọc thành công ✓ – Đội thợ đang tiến hành thi công"
//                 : isPendingConfirmation
//                   ? "Đã gửi thông tin chuyển khoản – Vui lòng chờ Admin xác nhận"
//                   : isCancelled
//                     ? "Đơn hàng đã bị hủy"
//                     : "Chưa đến giai đoạn thanh toán"}
//           </div>
//         )}
//       </div>

//       {/* Modal nộp ảnh cọc + VietQR */}
//       <Modal
//         isOpen={openDepositModal}
//         onClose={() => setOpenDepositModal(false)}
//         title={`Thanh toán tiền cọc đơn hàng #${booking.id}`}
//         size="lg"
//       >
//         <DepositPaymentProofModal
//           booking={booking}
//           onClose={() => setOpenDepositModal(false)}
//           onSubmitProof={handleDepositProofSubmit}
//           loading={paying}
//         />
//       </Modal>

//       {/* Modal tất toán cuối */}
//       <Modal
//         isOpen={openFinalQrModal}
//         onClose={() => setOpenFinalQrModal(false)}
//         title={`Thanh toán hoàn tất đơn hàng #${booking.id}`}
//         size="md"
//       >
//         <QRCodePayment
//           amount={remainingAmount}
//           orderId={booking.id}
//           addInfo={`TT DH${booking.id}`}
//           accountNo="0355880362"
//           accountName="VU VIET TAN"
//           title="Quét mã VietQR thanh toán phần còn lại"
//           subTitle="Mở ứng dụng ngân hàng bất kỳ để quét mã và chuyển khoản nhanh"
//           confirmText="Tôi đã chuyển khoản tất toán thành công"
//           confirmColor="bg-emerald-600 hover:bg-emerald-700"
//           onConfirm={handleFinalPaymentSubmit}
//           onClose={() => setOpenFinalQrModal(false)}
//           loading={paying}
//         />
//       </Modal>
//     </div>
//   );
// }



import { useState, useRef } from "react";
import AxiosConfig from "../../util/AxiosConfig";
import { formatMoney } from "../../util/formatters";
import Modal from "../common/Modal";
import QRCodePayment from "../common/QRCodePayment";
import DepositPaymentProofModal from "./DepositPaymentProofModal";
import DepositCountdownBadge from "./DepositCountdownBadge";

export function getPaymentState(booking) {
  if (!booking) return { canPayDeposit: false, canPayFinal: false };

  const isDepositPaid =
    booking.depositPaid ||
    booking.paymentStatus === "DEPOSIT_PAID" ||
    booking.paymentStatus === "FULLY_PAID";

  const isFinalPaid =
    booking.finalPaid || booking.paymentStatus === "FULLY_PAID";

  const isCancelled = booking.status === "CANCELLED";

  const canPayDeposit =
    !isDepositPaid &&
    !isCancelled &&
    [
      "PENDING",
      "SURVEY_ASSIGNED",
      "WAITING_CUSTOMER_SIGNATURE",
      "ASSIGNED",
      "PROCESSING",
      "CONTRACT_APPROVED",
    ].includes(booking.status);

  const canPayFinal =
    isDepositPaid &&
    !isFinalPaid &&
    !isCancelled &&
    ["WORKER_COMPLETED", "COMPLETED", "WAITING_FINAL_PAYMENT"].includes(
      booking.status
    );

  return { canPayDeposit, canPayFinal, isDepositPaid, isFinalPaid, isCancelled };
}

export default function PaymentSection({ booking, showToast, onRefresh, compact = false }) {
  const [paying, setPaying] = useState(false);
  const [openDepositModal, setOpenDepositModal] = useState(false);
  const [openFinalModal, setOpenFinalModal] = useState(false);

  // State cho modal thanh toán hoàn thành (giống như deposit)
  const [finalProofImage, setFinalProofImage] = useState(null);
  const [finalProofPreview, setFinalProofPreview] = useState("");
  const [finalCustomerNote, setFinalCustomerNote] = useState("");
  const [finalErrorMsg, setFinalErrorMsg] = useState("");
  const finalFileInputRef = useRef(null);

  const { canPayDeposit, canPayFinal, isDepositPaid, isFinalPaid, isCancelled } = getPaymentState(booking);

  const depositAmount =
    booking?.depositAmount && Number(booking.depositAmount) > 0
      ? Number(booking.depositAmount)
      : (Number(booking?.totalAmount) || 0) * 0.3;

  const remainingAmount =
    booking?.remainingAmount && Number(booking.remainingAmount) > 0
      ? Number(booking.remainingAmount)
      : Math.max(0, (Number(booking?.totalAmount) || 0) - depositAmount);

  const isPendingConfirmation = booking?.paymentStatus === "PENDING_CONFIRMATION";

  // Xử lý nộp ảnh chuyển khoản cọc
  const handleDepositProofSubmit = async ({ image, note }) => {
    if (!booking) return;

    try {
      setPaying(true);

      const formData = new FormData();
      formData.append("bookingId", booking.id);
      formData.append("paymentType", "DEPOSIT");
      if (note) formData.append("note", note);
      if (image) {
        formData.append("proofImage", image);
      }

      const res = await AxiosConfig.post("/payments/qr-submit", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      showToast?.(
        res.data?.message ||
        "Đã gửi ảnh thanh toán cọc thành công! Vui lòng chờ Admin xác nhận.",
        "success"
      );

      setOpenDepositModal(false);
      if (onRefresh) onRefresh();
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.messages?.join?.(", ") ||
        "Lỗi khi gửi xác nhận thanh toán";
      showToast?.(msg, "error");
      throw error;
    } finally {
      setPaying(false);
    }
  };

  // 👇 Xử lý nộp ảnh thanh toán hoàn thành (GIỐNG HỆT cọc)
  const handleFinalProofSubmit = async () => {
    if (!booking) return;

    if (!finalProofImage) {
      setFinalErrorMsg("Vui lòng tải lên ảnh chụp biên lai chuyển khoản thành công");
      return;
    }

    try {
      setPaying(true);

      const formData = new FormData();
      formData.append("bookingId", booking.id);
      formData.append("paymentType", "FINAL");
      if (finalCustomerNote.trim()) formData.append("note", finalCustomerNote.trim());
      if (finalProofImage) {
        formData.append("proofImage", finalProofImage);
      }

      const res = await AxiosConfig.post("/payments/qr-submit", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      showToast?.(
        res.data?.message ||
        "Đã gửi ảnh thanh toán tất toán thành công! Vui lòng chờ Admin xác nhận.",
        "success"
      );

      // Reset state
      setFinalProofImage(null);
      setFinalProofPreview("");
      setFinalCustomerNote("");
      setFinalErrorMsg("");
      if (finalFileInputRef.current) finalFileInputRef.current.value = "";

      setOpenFinalModal(false);
      if (onRefresh) onRefresh();
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.messages?.join?.(", ") ||
        "Lỗi khi gửi xác nhận thanh toán";
      setFinalErrorMsg(msg);
      showToast?.(msg, "error");
    } finally {
      setPaying(false);
    }
  };

  // Xử lý chọn file ảnh cho thanh toán hoàn thành
  const handleFinalFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFinalErrorMsg("Vui lòng chỉ tải lên file hình ảnh (JPG, PNG, JPEG)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setFinalErrorMsg("Kích thước ảnh tối đa 10MB");
      return;
    }

    setFinalErrorMsg("");
    setFinalProofImage(file);

    const reader = new FileReader();
    reader.onload = () => {
      setFinalProofPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleFinalRemoveImage = () => {
    setFinalProofImage(null);
    setFinalProofPreview("");
    if (finalFileInputRef.current) finalFileInputRef.current.value = "";
  };

  if (!booking) return null;

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      {/* Countdown 24h nếu chưa đóng cọc */}
      {!isDepositPaid && !isCancelled && (
        <DepositCountdownBadge
          signedAt={booking.createdAt || booking.appointmentDate}
          deadline={booking.depositDeadline}
          isDepositPaid={isDepositPaid}
          isCancelled={isCancelled}
        />
      )}

      {/* Banner chờ duyệt */}
      {isPendingConfirmation && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-center gap-2.5">
          <span className="text-lg animate-spin">⏳</span>
          <div>
            <p className="font-bold">Đang chờ Admin kiểm tra và xác nhận chuyển khoản</p>
            <p className="text-[11px] text-amber-600">
              Bạn đã gửi ảnh/biên lai chuyển khoản. Đội thi công sẽ được bàn giao ngay khi Admin duyệt cọc.
            </p>
          </div>
        </div>
      )}

      {/* Bảng tóm tắt số tiền */}
      <div className={`grid grid-cols-1 ${compact ? "sm:grid-cols-3" : "sm:grid-cols-3"} gap-3`}>
        <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
          <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">
            Tổng giá trị HĐ
          </div>
          <div className="text-base font-black text-slate-800">
            {formatMoney(booking.totalAmount || booking.service?.basePrice)}
          </div>
        </div>

        <div className="bg-blue-50/60 rounded-xl p-3 text-center border border-blue-100">
          <div className="text-[10px] text-blue-600 font-bold uppercase mb-1">
            Phí cọc (24h)
          </div>
          <div className="text-base font-black text-blue-700">
            {formatMoney(depositAmount)}
          </div>
          <div className="text-[10px] mt-1 font-semibold">
            {isDepositPaid ? (
              <span className="text-emerald-600">Đã thanh toán ✓</span>
            ) : isPendingConfirmation ? (
              <span className="text-amber-600">Chờ duyệt ⏳</span>
            ) : (
              <span className="text-rose-500">Chưa cọc</span>
            )}
          </div>
        </div>

        <div className="bg-emerald-50/60 rounded-xl p-3 text-center border border-emerald-100">
          <div className="text-[10px] text-emerald-600 font-bold uppercase mb-1">
            Còn lại sau hoàn thành
          </div>
          <div className="text-base font-black text-emerald-700">
            {formatMoney(remainingAmount)}
          </div>
          <div className="text-[10px] mt-1 font-semibold">
            {isFinalPaid ? (
              <span className="text-emerald-600">Đã thanh toán ✓</span>
            ) : isPendingConfirmation ? (
              <span className="text-amber-600">Chờ duyệt ⏳</span>
            ) : (
              <span className="text-slate-500">Chưa thanh toán</span>
            )}
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        {canPayDeposit && (
          <button
            type="button"
            onClick={() => setOpenDepositModal(true)}
            disabled={paying}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-blue-600/20"
          >
            <span>📱 Quét VietQR &amp; Gửi ảnh chuyển cọc (24h)</span>
          </button>
        )}

        {canPayFinal && (
          <button
            type="button"
            onClick={() => setOpenFinalModal(true)}
            disabled={paying}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
          >
            <span>📱 Quét VietQR &amp; Gửi ảnh thanh toán hoàn thành</span>
          </button>
        )}

        {!canPayDeposit && !canPayFinal && (
          <div className="w-full text-center py-2.5 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl">
            {isFinalPaid
              ? "Đã hoàn tất thanh toán 100% ✓"
              : isDepositPaid
                ? "Đã cọc thành công ✓ – Đội thợ đang tiến hành thi công"
                : isPendingConfirmation
                  ? "Đã gửi thông tin chuyển khoản – Vui lòng chờ Admin xác nhận"
                  : isCancelled
                    ? "Đơn hàng đã bị hủy"
                    : "Chưa đến giai đoạn thanh toán"}
          </div>
        )}
      </div>

      {/* Modal nộp ảnh cọc + VietQR */}
      <Modal
        isOpen={openDepositModal}
        onClose={() => setOpenDepositModal(false)}
        title={`Thanh toán tiền cọc đơn hàng #${booking.id}`}
        size="lg"
      >
        <DepositPaymentProofModal
          booking={booking}
          onClose={() => setOpenDepositModal(false)}
          onSubmitProof={handleDepositProofSubmit}
          loading={paying}
        />
      </Modal>

      {/* 👇 Modal tất toán cuối - GIỐNG HỆT MODAL CỌC (inline) */}
      <Modal
        isOpen={openFinalModal}
        onClose={() => {
          setOpenFinalModal(false);
          setFinalProofImage(null);
          setFinalProofPreview("");
          setFinalCustomerNote("");
          setFinalErrorMsg("");
          if (finalFileInputRef.current) finalFileInputRef.current.value = "";
        }}
        title={`Thanh toán hoàn tất đơn hàng #${booking.id}`}
        size="lg"
      >
        <div className="space-y-4 max-h-[85vh] overflow-y-auto px-1">
          {/* Countdown đếm ngược 24h */}
          <DepositCountdownBadge
            signedAt={booking.createdAt || booking.appointmentDate}
            isDepositPaid={booking.depositPaid || booking.paymentStatus === "DEPOSIT_PAID"}
            isCancelled={booking.status === "CANCELLED"}
          />

          <div className="space-y-5">
            {/* Thông tin VietQR */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <QRCodePayment
                amount={remainingAmount}
                orderId={booking.id}
                addInfo={`TT DH${booking.id}`}
                accountNo="0355880362"
                accountName="VU VIET TAN"
                title="Quét mã VietQR thanh toán phần còn lại"
                subTitle="Mở ứng dụng ngân hàng bất kỳ để quét mã chuyển nhanh"
                readOnly={true}
              />
            </div>

            {/* Form upload ảnh biên lai */}
            <form onSubmit={(e) => { e.preventDefault(); handleFinalProofSubmit(); }} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  📸 Tải lên ảnh chuyển khoản thành công <span className="text-rose-500">*</span>
                </label>
                <p className="text-[11px] text-slate-500 mb-3">
                  Chụp ảnh màn hình giao dịch chuyển khoản thành công trên App ngân hàng để gửi cho Admin đối soát.
                </p>

                {finalProofPreview ? (
                  <div className="relative border-2 border-emerald-400 bg-slate-50 rounded-2xl p-3 flex flex-col items-center justify-center group">
                    <img
                      src={finalProofPreview}
                      alt="Biên lai chuyển khoản"
                      className="max-h-64 max-w-full rounded-xl object-contain shadow-sm"
                    />
                    <div className="absolute top-4 right-4 flex gap-2">
                      <button
                        type="button"
                        onClick={handleFinalRemoveImage}
                        className="px-3 py-1.5 bg-rose-600/90 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-md transition"
                      >
                        ✕ Chọn ảnh khác
                      </button>
                    </div>
                    <span className="text-[11px] text-emerald-700 font-bold mt-2">
                      ✓ Đã chọn ảnh biên lai thành công
                    </span>
                  </div>
                ) : (
                  <div
                    onClick={() => finalFileInputRef.current?.click()}
                    className="border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/40 hover:bg-blue-50/70 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2"
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-2xl">
                      📁
                    </div>
                    <div>
                      <span className="text-xs font-bold text-blue-700 hover:underline">
                        Bấm vào đây để tải ảnh biên lai lên
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Hỗ trợ định dạng JPG, PNG (Dung lượng tối đa 10MB)
                      </p>
                    </div>
                  </div>
                )}

                <input
                  ref={finalFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFinalFileChange}
                  className="hidden"
                />
              </div>

              {/* Ô ghi chú */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ghi chú thêm cho Admin (tùy chọn)
                </label>
                <textarea
                  value={finalCustomerNote}
                  onChange={(e) => setFinalCustomerNote(e.target.value)}
                  placeholder="VD: Em đã chuyển khoản từ ngân hàng Vietcombank lúc 14h30..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none resize-none"
                />
              </div>

              {finalErrorMsg && (
                <p className="text-xs text-rose-600 font-semibold bg-rose-50 border border-rose-200 p-2.5 rounded-xl">
                  {finalErrorMsg}
                </p>
              )}

              {/* Buttons */}
              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setOpenFinalModal(false);
                    setFinalProofImage(null);
                    setFinalProofPreview("");
                    setFinalCustomerNote("");
                    setFinalErrorMsg("");
                    if (finalFileInputRef.current) finalFileInputRef.current.value = "";
                  }}
                  disabled={paying}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  Hủy &amp; Đóng
                </button>
                <button
                  type="submit"
                  disabled={paying || !finalProofPreview}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-md shadow-emerald-600/20"
                >
                  {paying ? "Đang gửi ảnh..." : "📤 Gửi ảnh xác nhận tất toán cho Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Modal>
    </div>
  );
}