// staff/technician/TechnicianProfile.jsx
const TechnicianProfile = () => {
  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 max-w-2xl">
      <div className="flex items-center gap-6 mb-8">
        <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center text-3xl">👷‍♂️</div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Trần Văn Thợ</h2>
          <p className="text-slate-500">Kinh nghiệm: 5 năm</p>
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Chuyên môn</label>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium">Sơn nội thất</span>
            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm font-medium">Sơn nước ngoại thất</span>
            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm font-medium">Bả matit</span>
          </div>
        </div>
        <div className="pt-4 border-t">
          <label className="block text-sm font-medium text-slate-700 mb-1">Đội nhóm (Nhóm thi công số 3)</label>
          <p className="text-sm text-slate-600">Bạn đang làm việc cùng: Anh Cường, Anh Nam, Anh Minh</p>
        </div>
      </div>
    </div>
  );
};

export default TechnicianProfile;