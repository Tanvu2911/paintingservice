// staff/technician/TechnicianWallet.jsx
import WalletCard from '../components/WalletCard';

const TechnicianWallet = () => {
  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-800">Thu nhập Thi công</h1>
      <WalletCard balance={8500000} title="Lương thi công tạm tính" />
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 border rounded-xl">
          <p className="text-slate-500 text-sm">Đã ứng trước</p>
          <p className="text-lg font-bold">2.000.000 ₫</p>
        </div>
        <div className="bg-white p-4 border rounded-xl">
          <p className="text-slate-500 text-sm">Tiền thưởng (Rating 5 sao)</p>
          <p className="text-lg font-bold text-emerald-600">+ 500.000 ₫</p>
        </div>
      </div>
    </div>
  );
};

export default TechnicianWallet;