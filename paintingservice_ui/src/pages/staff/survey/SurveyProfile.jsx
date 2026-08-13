// staff/survey/SurveyProfile.jsx
const SurveyProfile = () => {
  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 max-w-2xl">
      <div className="flex items-center gap-6 mb-8">
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-3xl">👤</div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Nguyễn Văn Khảo Sát</h2>
          <p className="text-slate-500">Chuyên viên đo bóc khối lượng sơn</p>
        </div>
      </div>
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại</label>
          <input type="text" defaultValue="0901234567" className="w-full p-2.5 border rounded-xl" disabled />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Khu vực phụ trách</label>
          <input type="text" defaultValue="Quận 1, Quận 3, Phú Nhuận" className="w-full p-2.5 border rounded-xl" />
        </div>
        <button className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl">Lưu thay đổi</button>
      </form>
    </div>
  );
};

export default SurveyProfile;