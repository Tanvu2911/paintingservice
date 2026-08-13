import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import DashboardHeader from '../../../components/layout/DashboardHeader';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { paintingService } from '../../../util/paintingService';

export default function InspectionPage() {
  const { user, showToast } = useOutletContext();
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await paintingService.getJobs();
        setJobs(res.data || []);
        if ((res.data || []).length > 0) setSelectedJob(res.data[0].id);
      } catch {
        showToast?.('Không tải được danh sách nghiệm thu', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [showToast]);

  const handleSubmitInspection = async () => {
    try {
      await paintingService.createInspection({
        jobId: Number(selectedJob),
        inspectedById: user?.id || 1,
        isCompleted: true,
        note,
      });
      showToast?.('Đã lưu phiếu nghiệm thu', 'success');
    } catch {
      showToast?.('Không lưu được phiếu nghiệm thu', 'error');
    }
  };

  return (
    <div>
      <DashboardHeader title="Nghiệm thu công trình" subtitle="Kết thúc quy trình và xác nhận hoàn thành" userName={user?.username} userRole="Quản trị viên" avatarChar={(user?.username || 'A').charAt(0).toUpperCase()} />
      {loading ? <LoadingSpinner /> : (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <label className="mb-2 block text-sm font-semibold text-slate-600">Chọn công trình</label>
          <select value={selectedJob} onChange={(e) => setSelectedJob(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
            {jobs.map((job) => <option key={job.id} value={job.id}>#{job.id} - {job.title}</option>)}
          </select>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows="5" className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Nhập ghi chú nghiệm thu..." />
          <button onClick={handleSubmitInspection} className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Lưu phiếu nghiệm thu</button>
        </div>
      )}
    </div>
  );
}
