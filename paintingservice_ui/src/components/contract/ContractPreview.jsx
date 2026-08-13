import StatusBadge from "../common/StatusBadge";
import { formatMoney } from "../../util/formatters";

export default function ContractPreview({
  contract,
  bookingDetail,
  onClose,
  onViewBooking,
}) {
  if (!contract) return null;

  const getSurveySignatureImg = (c) =>
    c?.workerSignatureImg || c?.surveySignatureImg || null;

  const getSurveySigned = (c) => !!(c?.workerSigned || c?.surveySigned);

  const getSurveySignedAt = (c) =>
    c?.workerSignedAt || c?.surveySignedAt || null;

  const getCustomerName = () => {
    if (!bookingDetail) return "—";
    return (
      bookingDetail.customerName ||
      bookingDetail.customer?.fullName ||
      bookingDetail.customer?.username ||
      "—"
    );
  };

  const getWorkerName = () => {
    if (!bookingDetail) return "—";
    return (
      bookingDetail.technicianName ||
      bookingDetail.technician?.fullName ||
      bookingDetail.technician?.username ||
      bookingDetail.preferredTechnicianName ||
      bookingDetail.preferredTechnician?.fullName ||
      "—"
    );
  };

  const getSupervisorName = () => {
    if (!bookingDetail) return "—";
    return (
      bookingDetail.surveyorName ||
      bookingDetail.supervisorName ||
      bookingDetail.surveyor?.fullName ||
      bookingDetail.surveyor?.username ||
      "—"
    );
  };

  const getAmount = () => {
    if (!bookingDetail) return null;
    return bookingDetail.totalAmount ?? bookingDetail.amount ?? null;
  };

  const status =
    contract.status ||
    (contract.customerSigned && getSurveySigned(contract)
      ? "CONTRACT_CONFIRMED"
      : contract.customerSigned
      ? "CUSTOMER_SIGNED"
      : getSurveySigned(contract)
      ? "WORKER_SIGNED"
      : "PENDING");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap justify-between items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
        <span>Mã: {contract.contractCode || `#${contract.id}`}</span>
        <span
          className={
            contract.customerSigned ? "text-emerald-600" : "text-amber-500"
          }
        >
          {contract.customerSigned ? "Khách đã ký" : "Chờ khách ký"}
        </span>
      </div>

      {/* Badges ký */}
      <div className="flex flex-wrap gap-2 text-xs">
        <span
          className={`px-2.5 py-1 rounded-full font-semibold ${
            getSurveySigned(contract)
              ? "bg-blue-50 text-blue-700"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {getSurveySigned(contract) ? "✓ Giám sát đã ký" : "○ Giám sát chưa ký"}
        </span>
        <span
          className={`px-2.5 py-1 rounded-full font-semibold ${
            contract.customerSigned
              ? "bg-emerald-50 text-emerald-700"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {contract.customerSigned ? "✓ Khách đã ký" : "○ Khách chưa ký"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm bg-slate-50 rounded-xl p-4 border border-slate-100">
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase mb-0.5">
            Đơn hàng
          </p>
          <p className="font-semibold text-slate-800">
            #{contract.bookingId || "—"}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase mb-0.5">
            Giá trị
          </p>
          <p className="font-semibold text-blue-600">
            {formatMoney(getAmount())}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase mb-0.5">
            Khách hàng
          </p>
          <p className="font-medium text-slate-800">{getCustomerName()}</p>
        </div>
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase mb-0.5">
            Giám sát
          </p>
          <p className="font-medium text-slate-800">{getSupervisorName()}</p>
        </div>
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase mb-0.5">
            Đội thợ / Thợ
          </p>
          <p className="font-medium text-slate-800">{getWorkerName()}</p>
        </div>
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase mb-0.5">
            Ngày lập
          </p>
          <p className="text-slate-700">
            {contract.createdAt
              ? new Date(contract.createdAt).toLocaleString("vi-VN")
              : "—"}
          </p>
        </div>
        <div className="col-span-2">
          <p className="text-[11px] font-bold text-slate-400 uppercase mb-0.5">
            Trạng thái
          </p>
          <StatusBadge status={status} />
        </div>
      </div>

      <div>
        <p className="text-[11px] font-bold text-slate-400 uppercase mb-2">
          Nội dung hợp đồng
        </p>
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap min-h-[140px] max-h-[280px] overflow-y-auto">
          {contract.content || "Chưa có nội dung"}
        </div>
      </div>

      {/* Chữ ký */}
      {(getSurveySignatureImg(contract) || contract.customerSignatureImg) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {getSurveySignatureImg(contract) && (
            <div className="border border-blue-100 rounded-xl p-3 bg-blue-50/40">
              <p className="text-[10px] font-bold text-blue-700 uppercase mb-2 tracking-wide">
                Chữ ký Giám sát / Khảo sát viên
              </p>
              <div className="bg-white rounded-lg border border-blue-100 p-2 flex items-center justify-center min-h-[80px]">
                <img
                  src={getSurveySignatureImg(contract)}
                  alt="Chữ ký giám sát"
                  className="max-h-28 max-w-full object-contain"
                />
              </div>
              {getSurveySignedAt(contract) && (
                <p className="text-[10px] text-slate-500 mt-1.5">
                  Ký lúc:{" "}
                  {new Date(getSurveySignedAt(contract)).toLocaleString("vi-VN")}
                </p>
              )}
            </div>
          )}
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
        </div>
      )}

      <div className="flex flex-wrap gap-3 pt-2">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 font-bold text-slate-600 rounded-xl text-sm hover:bg-slate-200 transition"
          >
            Đóng
          </button>
        )}
        {onViewBooking && contract.bookingId && (
          <button
            type="button"
            onClick={() => onViewBooking(contract.bookingId)}
            className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700 transition"
          >
            Xem đơn hàng
          </button>
        )}
      </div>
    </div>
  );
}
