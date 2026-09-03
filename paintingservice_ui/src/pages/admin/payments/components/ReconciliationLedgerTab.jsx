import React from "react";
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  Clock,
  QrCode,
} from "lucide-react";
import { formatMoney } from "../../../../util/formatters";

export default function ReconciliationLedgerTab({
  filteredLedger,
  kpi,
  fmtDate,
  openPayoutQR,
  openWarrantyPayoutQR,
  navigate,
  thCls,
  tdCls,
}) {
  return (
    <div className="space-y-5">
      {/* Thẻ Dòng Tiền Ròng Hệ Thống */}
      <div className="bg-blue-600 rounded-lg p-6 sm:p-7 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1">
              <Wallet className="w-4 h-4 text-white" />
              <span>Số Dư Dòng Tiền Thực Tế Hệ Thống (Dòng Tiền Ròng)</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-mono">
              {formatMoney(kpi.systemNetBalance)}
            </h2>
            <p className="text-xs text-slate-300 mt-2 max-w-xl">
              Công thức: <strong className="text-white">Tổng thực thu (+{formatMoney(kpi.totalCollected)})</strong> trừ đi{" "}
              <strong className="text-slate-300">Tổng đã chi (-{formatMoney(kpi.totalStaffPaid)})</strong>{" "}
              (gồm lương thi công và tiền công thợ bảo hành).
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-xs rounded-lg p-3.5 border border-white/15 text-xs">
              <p className="text-slate-300 font-medium">Tổng Thu Vào (+)</p>
              <p className="text-base font-bold text-white mt-0.5 font-mono">
                +{formatMoney(kpi.totalCollected)}
              </p>
              <p className="text-[10px] text-slate-300 mt-1">HĐ + Khách trả BH</p>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-lg p-3.5 border border-white/15 text-xs">
              <p className="text-slate-300 font-medium">Tổng Đã Chi (-)</p>
              <p className="text-base font-bold text-slate-300 mt-0.5 font-mono">
                -{formatMoney(kpi.totalStaffPaid)}
              </p>
              <p className="text-[10px] text-slate-300 mt-1">Thi công + Công BH</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bảng Đối Soát Chi Tiết Giao Dịch */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Sổ Nhật Ký Thu Chi &amp; Đối Soát Giao Dịch
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Theo dõi chi tiết từng dòng tiền vào và ra gắn liền với mã đơn công trình &amp; bảo hành
            </p>
          </div>
          <span className="text-xs text-slate-500 font-mono font-medium">
            {filteredLedger.length} giao dịch
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className={thCls}>Luồng</th>
                <th className={thCls}>Mã Đơn / BH</th>
                <th className={thCls}>Danh Mục Giao Dịch</th>
                <th className={thCls}>Đối Tác / Nhân Sự</th>
                <th className={thCls + " text-right"}>Số Tiền</th>
                <th className={thCls + " text-center"}>Trạng Thái</th>
                <th className={thCls}>Ngày Ghi Nhận</th>
                <th className={thCls + " text-right"}>Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredLedger.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    Không có giao dịch đối soát nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredLedger.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => {
                      if (item.claimId) navigate(`/admin/warranties/${item.claimId}`);
                      else if (item.bookingId) navigate(`/admin/bookings/${item.bookingId}`);
                    }}
                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <td className={tdCls}>
                      {item.type === "IN" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-900 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                          <ArrowDownLeft className="w-3 h-3 text-slate-500" /> Vào (+)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-900 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                          <ArrowUpRight className="w-3 h-3 text-slate-500" /> Ra (-)
                        </span>
                      )}
                    </td>

                    <td className={tdCls + " font-bold text-slate-900 font-mono"}>
                      {item.claimId ? (
                        <span className="text-slate-900">BH #{item.claimId}</span>
                      ) : (
                        <span>#{item.bookingId}</span>
                      )}
                    </td>

                    <td className={tdCls + " font-semibold text-slate-900"}>
                      {item.category}
                    </td>

                    <td className={tdCls}>
                      <p className="font-bold text-slate-900">{item.party}</p>
                      <p className="text-[10px] text-slate-500">{item.partyRole}</p>
                    </td>

                    <td className={tdCls + " text-right font-black font-mono"}>
                      <span className={item.type === "IN" ? "text-slate-900" : "text-slate-500"}>
                        {item.type === "IN" ? "+" : "-"}
                        {formatMoney(item.amount)}
                      </span>
                    </td>

                    <td className={tdCls + " text-center"}>
                      {item.status === "COMPLETED" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                          <Check className="w-2.5 h-2.5" /> {item.statusText}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                          <Clock className="w-2.5 h-2.5" /> {item.statusText}
                        </span>
                      )}
                    </td>

                    <td className={tdCls + " text-slate-500 whitespace-nowrap"}>
                      {fmtDate(item.date)}
                    </td>

                    <td
                      className={tdCls + " text-right whitespace-nowrap"}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1">
                        {item.canPayout && (
                          <button
                            type="button"
                            onClick={() =>
                              openPayoutQR(
                                item.order,
                                item.staffId,
                                item.party,
                                item.role,
                                item.amount
                              )
                            }
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-white bg-blue-600 hover:bg-blue-600 px-2 py-1 rounded transition cursor-pointer"
                          >
                            <QrCode className="w-3 h-3" /> Quyết toán
                          </button>
                        )}
                        {item.canPayoutWarranty && (
                          <button
                            type="button"
                            onClick={() =>
                              openWarrantyPayoutQR(
                                item.claim,
                                item.staffId,
                                item.party,
                                item.role,
                                item.amount
                              )
                            }
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-white bg-blue-600 hover:bg-blue-600 px-2 py-1 rounded transition cursor-pointer"
                          >
                            <QrCode className="w-3 h-3" /> Quyết toán BH
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Tổng kết Sổ cái */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap gap-6 text-slate-500">
            <span>
              Tổng tiền vào (+):{" "}
              <strong className="text-slate-900 font-mono font-bold">
                +{formatMoney(kpi.totalCollected)}
              </strong>
            </span>
            <span>
              Tổng tiền đã chi (-):{" "}
              <strong className="text-slate-500 font-mono font-bold">
                -{formatMoney(kpi.totalStaffPaid)}
              </strong>
            </span>
            <span>
              Chờ quyết toán:{" "}
              <strong className="text-slate-900 font-mono font-bold">
                {formatMoney(kpi.totalStaffPending)}
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Số dư ròng hệ thống:</span>
            <span className="text-sm font-black text-slate-900 font-mono">
              {formatMoney(kpi.systemNetBalance)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}



