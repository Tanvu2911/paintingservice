// staff/survey/SurveyHistory.jsx
const SurveyHistory = () => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <h2 className="text-xl font-bold text-slate-800 mb-6">Lịch sử Khảo sát</h2>
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            <th className="p-4 rounded-l-xl">Mã ĐH</th>
            <th className="p-4">Địa chỉ công trình</th>
            <th className="p-4">Ngày hoàn thành</th>
            <th className="p-4">Diện tích đo (m2)</th>
            <th className="p-4 rounded-r-xl">Thù lao</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          <tr>
            <td className="p-4 font-medium">#KS092</td>
            <td className="p-4">45 Lê Văn Sỹ, Phú Nhuận</td>
            <td className="p-4">24/10/2025</td>
            <td className="p-4">120m2</td>
            <td className="p-4 text-emerald-600 font-bold">+ 150.000đ</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default SurveyHistory;