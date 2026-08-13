import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import DashboardHeader from '../../../components/layout/DashboardHeader';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import StatusBadge from '../../../components/common/StatusBadge';
import { paintingService } from '../../../util/paintingService';

export default function PaintingRequestList() {
  const { user, showToast } = useOutletContext();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await paintingService.getJobs();
        setJobs(res.data || []);
      } catch {
        showToast?.('Không tải được yêu cầu sơn nhà', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [showToast]);

  const handleCreate = async () => {
    const payload = {
      title: 'Yêu cầu sơn nhà mới',
      customerId: 1,
      customerName: 'Khách hàng demo',
      address: 'Địa chỉ demo',
      description: 'Yêu cầu tạo từ giao diện demo',
      preferredDate: '2026-08-15',
      status: 'PENDING',
    };

    try {
      const res = await paintingService.createJob(payload);
      setJobs((prev) => [res.data, ...prev]);
      showToast?.('Đã tạo công việc sơn nhà mới', 'success');
    } catch {
      showToast?.('Không tạo được công việc mới', 'error');
    }
  };

  return (
    <div>
      <DashboardHeader title="Danh sách yêu cầu sơn nhà" subtitle="Quản trị viên tiếp nhận và phân công công việc" userName={user?.username} userRole="Quản trị viên" avatarChar={(user?.username || 'A').charAt(0).toUpperCase()} />
      <div className="mb-4 flex justify-end">
        <button onClick={handleCreate} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">+ Tạo yêu cầu demo</button>
      </div>
      {loading ? <LoadingSpinner /> : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Mã</th>
                <th className="px-4 py-3 text-left">Tiêu đề</th>
                <th className="px-4 py-3 text-left">Khách hàng</th>
                <th className="px-4 py-3 text-left">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-800">#{job.id}</td>
                  <td className="px-4 py-3">{job.title}</td>
                  <td className="px-4 py-3">{job.customerName || 'Khách hàng'}</td>
                  <td className="px-4 py-3"><StatusBadge status={job.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
