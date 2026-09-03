import React from "react";
import { Eye, CreditCard, ShieldCheck, Check, Clock } from "lucide-react";
import StatusBadge from "../../../../components/common/StatusBadge";
import { formatMoney } from "../../../../util/formatters";
import { calculateFinancials } from "../../../../util/orderFlowUtils";

function Badge({ ok, okLabel = "Đã chi", failLabel = "Chưa chi" }) {
  return ok ? (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-900 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
      <Check className="w-2.5 h-2.5" /> {okLabel}
    </span>
  ) : (
    <span className="text-[10px] font-semibold text-slate-900 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
      {failLabel}
    </span>
  );
}

export default function CustomerRevenueTab({
  customerSubTab,
  setCustomerSubTab,
  filteredOrders,
  filteredWarrantyClaims,
  kpi,
  fmtDate,
  navigate,
  thCls,
  tdCls,
}) {
  const warrantyCustomerClaims = filteredWarrantyClaims.filter(
    (c) => Number(c.finalSupportPrice) > 0
  );

  return (
    <div className="space-y-4">
      {/* Sub-tab selection */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setCustomerSubTab("ALL")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            customerSubTab === "ALL"
              ? "bg-blue-600 text-white"
              : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-200"
          }`}
        >
          Tất cả ({filteredOrders.length + warrantyCustomerClaims.length})
        </button>
        <button
          type="button"
          onClick={() => setCustomerSubTab("BOOKING")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
            customerSubTab === "BOOKING"
              ? "bg-blue-600 text-white"
              : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-200"
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Đơn công trình ({filteredOrders.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setCustomerSubTab("WARRANTY")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
            customerSubTab === "WARRANTY"
              ? "bg-blue-600 text-white"
              : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-200"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Tiền khách trả công thợ BH ({warrantyCustomerClaims.length})</span>
        </button>
      </div>

      {/* BẢNG 1A: THU TIỀN ĐƠN CÔNG TRÌNH GỐC */}
      {(customerSubTab === "ALL" || customerSubTab === "BOOKING") && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="font-bold text-xs text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-slate-900" />
              <span>Thu tiền Hợp đồng công trình (Cọc 30% &amp; Tất toán 70%)</span>
            </span>
            <span className="text-xs font-bold text-slate-900 font-mono">
              Thực thu: {formatMoney(kpi.totalBookingCollected)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className={thCls}>Mã đơn &amp; Ngày</th>
                  <th className={thCls}>Khách hàng</th>
                  <th className={thCls}>Dịch vụ &amp; Địa chỉ</th>
                  <th className={thCls + " text-right"}>Tổng giá trị HĐ</th>
                  <th className={thCls + " text-right"}>Thực thu (Cọc &amp; Tất toán)</th>
                  <th className={thCls + " text-center"}>Trạng thái đơn</th>
                  <th className={thCls + " text-right"}>Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-500">
                      Không tìm thấy đơn hàng nào phù hợp bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((o) => {
                    const fin = calculateFinancials(o);
                    const customerName =
                      o.customerName ||
                      o.customer?.fullName ||
                      o.customer?.username ||
                      "—";

                    return (
                      <tr
                        key={o.id}
                        onClick={() => navigate(`/admin/bookings/${o.id}`)}
                        className="hover:bg-slate-50 transition-colors cursor-pointer group"
                      >
                        <td className={tdCls}>
                          <div className="font-bold text-slate-900 font-mono">#{o.id}</div>
                          <div className="text-[11px] text-slate-500">{fmtDate(o.createdAt)}</div>
                        </td>
                        <td className={tdCls}>
                          <p className="font-bold text-slate-900">{customerName}</p>
                          {o.customerPhone && (
                            <p className="text-[11px] text-slate-500">{o.customerPhone}</p>
                          )}
                        </td>
                        <td className={tdCls + " max-w-[220px]"}>
                          <p className="font-semibold text-slate-900 truncate">
                            {o.serviceName || o.service?.name || "—"}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {o.address || "—"}
                          </p>
                        </td>
                        <td className={tdCls + " text-right font-bold text-slate-900 font-mono"}>
                          {formatMoney(fin.total)}
                        </td>
                        <td className={tdCls + " text-right"}>
                          <div className="font-bold text-slate-900 font-mono">
                            {formatMoney(fin.collected)}
                          </div>
                          <div className="flex items-center justify-end gap-1 mt-0.5">
                            <Badge ok={fin.isDepositPaid} okLabel="Cọc 30%" failLabel="Chưa cọc" />
                            {fin.isFinalPaid && <Badge ok={true} okLabel="Tất toán 100%" />}
                          </div>
                        </td>
                        <td className={tdCls + " text-center"}>
                          <StatusBadge status={o.status} />
                        </td>
                        <td
                          className={tdCls + " text-right whitespace-nowrap"}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/bookings/${o.id}`)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition cursor-pointer"
                            title="Xem chi tiết đơn hàng"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BẢNG 1B: TIỀN KHÁCH TRẢ CÔNG THỢ CHO ĐƠN BẢO HÀNH */}
      {(customerSubTab === "ALL" || customerSubTab === "WARRANTY") && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-900" />
              <div>
                <span className="font-bold text-xs text-slate-900">
                  Tiền khách trả để trả công thợ bảo hành (Lỗi khách quan &bull; VNPay Sandbox)
                </span>
                <p className="text-[10.5px] text-slate-500">
                  Khoản thu này là nguồn tiền dùng để quyết toán trực tiếp cho thợ thi công
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-900 font-mono">
              Khách đã đóng:{" "}
              <strong className="text-slate-900">
                {formatMoney(kpi.warrantyCustomerPaidTotal)}
              </strong>{" "}
              &bull; Chờ đóng:{" "}
              <strong className="text-slate-900">
                {formatMoney(kpi.warrantyCustomerPendingTotal)}
              </strong>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className={thCls}>Phiếu BH &amp; Đơn gốc</th>
                  <th className={thCls}>Khách hàng &amp; Sự cố</th>
                  <th className={thCls + " text-right"}>Tiền khách trả công thợ</th>
                  <th className={thCls + " text-center"}>Trạng thái cộng số dư</th>
                  <th className={thCls}>Kênh &amp; Mã GD VNPay</th>
                  <th className={thCls + " text-right"}>Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {warrantyCustomerClaims.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-500">
                      Chưa có phiếu bảo hành nào phát sinh chi phí hỗ trợ sửa chữa từ khách.
                    </td>
                  </tr>
                ) : (
                  warrantyCustomerClaims.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => navigate(`/admin/warranties/${c.id}`)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer group"
                    >
                      <td className={tdCls}>
                        <div className="font-bold text-slate-900 font-mono">BH #{c.id}</div>
                        <div className="text-[11px] text-slate-500 font-bold">
                          Đơn #{c.bookingId} &bull; {fmtDate(c.createdAt)}
                        </div>
                      </td>
                      <td className={tdCls}>
                        <p className="font-bold text-slate-900">
                          {c.customerName || "Khách hàng"}
                        </p>
                        <p className="text-[11px] text-slate-500 line-clamp-1">
                          {c.issueTitle || c.description || "Hỗ trợ sửa chữa"}
                        </p>
                      </td>
                      <td className={tdCls + " text-right font-black font-mono text-slate-900 text-sm"}>
                        +{formatMoney(c.finalSupportPrice)}
                      </td>
                      <td className={tdCls + " text-center"}>
                        {c.customerPaid || c.customerAccepted ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                            <Check className="w-3 h-3 text-emerald-600" /> Đã thu tiền (Cộng số dư)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                            <Clock className="w-3 h-3 text-amber-600" /> Chờ khách đóng tiền
                          </span>
                        )}
                      </td>
                      <td className={tdCls}>
                        <p className="font-bold text-slate-900">
                          {c.customerPaymentMethod ||
                            (c.customerPaid || c.customerAccepted ? "VNPay Sandbox" : "Chờ thanh toán")}
                        </p>
                        {c.customerTransactionCode && (
                          <p className="text-[10px] text-slate-500 font-mono">
                            {c.customerTransactionCode}
                          </p>
                        )}
                      </td>
                      <td
                        className={tdCls + " text-right whitespace-nowrap"}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/warranties/${c.id}`)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition cursor-pointer"
                          title="Xem chi tiết bảo hành"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}


