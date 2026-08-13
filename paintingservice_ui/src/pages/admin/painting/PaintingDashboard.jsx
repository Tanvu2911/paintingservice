import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import DashboardHeader from '../../../components/layout/DashboardHeader';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import StatusBadge from '../../../components/common/StatusBadge';
import { paintingService } from '../../../util/paintingService';

export default function PaintingDashboard() {
  const { user, showToast } = useOutletContext();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await paintingService.getJobs();
        setJobs(res.data || []);
      } catch {
        showToast?.('Không tải được danh sách công việc sơn nhà', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [showToast]);

  const stats = useMemo(() => ({
    total: jobs.length,
    pending: jobs.filter((j) => j.status === 'PENDING').length,
    inProgress: jobs.filter((j) => ['ASSIGNED_TEAM', 'IN_PROGRESS'].includes(j.status)).length,
    completed: jobs.filter((j) => ['COMPLETED'].includes(j.status)).length,
  }), [jobs]);

  return (
    <div>
      <DashboardHeader title="Dịch vụ Sơn Nhà" subtitle="Theo dõi toàn bộ quy trình từ yêu cầu đến nghiệm thu" userName={user?.username} userRole="Quản trị viên" avatarChar={(user?.username || 'A').charAt(0).toUpperCase()} />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">Tổng công việc</p><p className="text-2xl font-black text-slate-900">{stats.total}</p></div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm"><p className="text-sm text-amber-700">Chờ xử lý</p><p className="text-2xl font-black text-amber-700">{stats.pending}</p></div>
        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 shadow-sm"><p className="text-sm text-orange-700">Đang thi công</p><p className="text-2xl font-black text-orange-700">{stats.inProgress}</p></div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm"><p className="text-sm text-emerald-700">Hoàn thành</p><p className="text-2xl font-black text-emerald-700">{stats.completed}</p></div>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Mã</th>
                  <th className="px-4 py-3 text-left">Khách hàng</th>
                  <th className="px-4 py-3 text-left">Địa chỉ</th>
                  <th className="px-4 py-3 text-left">Trạng thái</th>
                  <th className="px-4 py-3 text-left">Tiến độ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-800">#{job.id}</td>
                    <td className="px-4 py-3">{job.customerName || 'Khách hàng'}</td>
                    <td className="px-4 py-3">{job.address}</td>
                    <td className="px-4 py-3"><StatusBadge status={job.status} /></td>
                    <td className="px-4 py-3">{job.completionPercent ?? 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
