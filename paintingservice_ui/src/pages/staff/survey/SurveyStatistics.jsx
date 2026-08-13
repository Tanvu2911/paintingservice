// staff/survey/SurveyStatistics.jsx
import StatisticCards from '../components/StatisticCards';

const SurveyStatistics = () => {
  const stats = [
    { title: 'Tổng nhà đã khảo sát', value: '45', icon: '🏠', color: 'border-l-blue-500' },
    { title: 'Tỷ lệ chốt đơn', value: '78%', icon: '📈', color: 'border-l-emerald-500' },
    { title: 'Đánh giá trung bình', value: '4.9 ⭐', icon: '🌟', color: 'border-l-amber-500' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Thống kê hiệu suất (Khảo sát)</h1>
      <StatisticCards data={stats} />
    </div>
  );
};

export default SurveyStatistics;