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
    blue: "from-[#1E3A8A] via-slate-900 to-slate-950",
    amber: "from-amber-600 via-slate-900 to-slate-950",
    emerald: "from-[#1E3A8A] via-slate-900 to-slate-950",
  };

  return (
    <div
      className={`bg-gradient-to-br ${gradients[accent] || gradients.blue} rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-blue-900/30 relative overflow-hidden`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -mr-10 -mt-10 blur-2xl pointer-events-none" />
      <p className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
      {subtitle && <p className="text-xs text-slate-300 mb-2">{subtitle}</p>}
      <h2 className="text-3xl sm:text-4xl font-black mb-6 text-white font-mono">
        {formatMoney(balance)}
      </h2>
      {(onWithdraw || onViewHistory) && (
        <div className="flex flex-wrap gap-3">
          {onWithdraw && (
            <button
              type="button"
              onClick={onWithdraw}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 rounded-2xl font-bold text-xs text-white transition shadow-md shadow-amber-500/20 cursor-pointer active:scale-95"
            >
              Rút tiền
            </button>
          )}
          {onViewHistory && (
            <button
              type="button"
              onClick={onViewHistory}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-2xl font-bold text-xs text-white transition cursor-pointer"
            >
              Lịch sử GD
            </button>
          )}
        </div>
      )}
    </div>
  );
}
