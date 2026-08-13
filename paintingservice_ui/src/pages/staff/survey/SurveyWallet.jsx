// staff/survey/SurveyWallet.jsx
import WalletCard from '../components/WalletCard';

const SurveyWallet = () => {
  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-800">Ví / Thu nhập Khảo sát</h1>
      <WalletCard balance={1250000} title="Số dư có thể rút" />
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="font-bold text-slate-800 mb-4">Giao dịch gần đây</h3>
        <p className="text-slate-500 text-sm">Chưa có giao dịch rút tiền nào.</p>
      </div>
    </div>
  );
};

export default SurveyWallet;