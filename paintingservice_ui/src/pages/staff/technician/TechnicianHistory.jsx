// staff/technician/TechnicianHistory.jsx

const TechnicianHistory = () => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <h2 className="text-xl font-bold text-slate-800 mb-6">Lịch sử Thi công</h2>
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            <th className="p-4 rounded-l-xl">Công trình</th>
            <th className="p-4">Khối lượng thi công</th>
            <th className="p-4">Ngày nghiệm thu</th>
            <th className="p-4 rounded-r-xl">Đánh giá của KH</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          <tr>
            <td className="p-4 font-medium">Sơn nội thất CC Gateway</td>
            <td className="p-4">80m2 (2 lớp màu, 1 lót)</td>
            <td className="p-4">10/10/2025</td>
            <td className="p-4 text-amber-500">⭐⭐⭐⭐⭐</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default TechnicianHistory;