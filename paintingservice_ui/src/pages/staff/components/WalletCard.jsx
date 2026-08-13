// staff/components/WalletCard.jsx
const WalletCard = ({ balance, title }) => {
  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full opacity-20 -mr-10 -mt-10 blur-2xl"></div>
      <p className="text-slate-300 text-sm font-medium mb-1">{title}</p>
      <h2 className="text-4xl font-bold mb-6">{balance.toLocaleString('vi-VN')} ₫</h2>
      <div className="flex gap-4">
        <button className="px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-xl font-medium transition">
          Rút tiền
        </button>
        <button className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl font-medium transition">
          Lịch sử GD
        </button>
      </div>
    </div>
  );
};

export default WalletCard;