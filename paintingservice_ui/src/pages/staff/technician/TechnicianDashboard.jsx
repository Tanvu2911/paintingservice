// staff/technician/TechnicianDashboard.jsx
import StatisticCards from '../components/StatisticCards';

const TechnicianDashboard = () => {
  const stats = [
    { title: 'Công trình đang làm', value: '1', icon: '🏗️', color: 'border-l-blue-500' },
    { title: 'Công trình hoàn thành', value: '12', icon: '✅', color: 'border-l-emerald-500' },
    { title: 'Tổng tiền công (Tháng)', value: '8.5M', icon: '💰', color: 'border-l-amber-500' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Tổng quan thi công</h1>
      <StatisticCards data={stats} />
      <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-sm">
        <span className="font-bold">Lưu ý an toàn:</span> Hãy luôn nhớ mang đồ bảo hộ và che chắn nội thất của khách hàng trước khi bả matit/lăn sơn nhé!
      </div>
    </div>
  );
};

export default TechnicianDashboard;