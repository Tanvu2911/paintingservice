import { formatMoney } from "../../util/formatters";

export default function WalletCard({
  balance = 0,
  title = "Số dư khả dụng",
  subtitle,
  onWithdraw,
  onViewHistory,
  accent = "blue",
}) {
  const gradients = {
    blue: "from-slate-800 to-slate-900",
    amber: "from-amber-700 to-slate-900",
    emerald: "from-emerald-800 to-slate-900",
  };

  return (
    <div
      className={`bg-gradient-to-br ${gradients[accent] || gradients.blue} rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl" />
      <p className="text-slate-300 text-sm font-medium mb-1">{title}</p>
      {subtitle && <p className="text-xs text-slate-400 mb-2">{subtitle}</p>}
      <h2 className="text-3xl sm:text-4xl font-bold mb-6">
        {formatMoney(balance)}
      </h2>
      {(onWithdraw || onViewHistory) && (
        <div className="flex flex-wrap gap-3">
          {onWithdraw && (
            <button
              type="button"
              onClick={onWithdraw}
              className="px-5 py-2 bg-blue-500 hover:bg-blue-600 rounded-xl font-medium text-sm transition"
            >
              Rút tiền
            </button>
          )}
          {onViewHistory && (
            <button
              type="button"
              onClick={onViewHistory}
              className="px-5 py-2 bg-white/10 hover:bg-white/20 rounded-xl font-medium text-sm transition"
            >
              Lịch sử GD
            </button>
          )}
        </div>
      )}
    </div>
  );
}
