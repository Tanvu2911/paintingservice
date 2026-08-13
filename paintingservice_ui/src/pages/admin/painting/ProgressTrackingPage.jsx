import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import DashboardHeader from '../../../components/layout/DashboardHeader';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { paintingService } from '../../../util/paintingService';

export default function ProgressTrackingPage() {
  const { user, showToast } = useOutletContext();
  const [jobs, setJobs] = useState([]);
  const [progress, setProgress] = useState([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [jobsRes, progressRes] = await Promise.all([
          paintingService.getJobs(),
          paintingService.getProgress(1),
        ]);
        setJobs(jobsRes.data || []);
        setProgress(progressRes.data || []);
        if ((jobsRes.data || []).length > 0) setSelectedJob(jobsRes.data[0].id);
      } catch {
        showToast?.('Không tải được tiến độ công trình', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [showToast]);

  const handleLoadProgress = async (jobId) => {
    try {
      const res = await paintingService.getProgress(jobId);
      setProgress(res.data || []);
      setSelectedJob(jobId);
    } catch {
      showToast?.('Không tải được báo cáo tiến độ', 'error');
    }
  };

  return (
    <div>
      <DashboardHeader title="Theo dõi tiến độ" subtitle="Theo dõi % hoàn thành và báo cáo thực hiện" userName={user?.username} userRole="Quản trị viên" avatarChar={(user?.username || 'A').charAt(0).toUpperCase()} />
      {loading ? <LoadingSpinner /> : (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <label className="mb-3 block text-sm font-semibold text-slate-600">Chọn công trình</label>
          <select value={selectedJob} onChange={(e) => handleLoadProgress(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
            {jobs.map((job) => <option key={job.id} value={job.id}>#{job.id} - {job.title}</option>)}
          </select>
          <div className="mt-5 space-y-3">
            {progress.length === 0 ? <p className="text-sm text-slate-500">Chưa có báo cáo tiến độ</p> : progress.map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-800">Tiến độ {item.completionPercent || 0}%</p>
                  <p className="text-xs text-slate-500">{item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : ''}</p>
                </div>
                <p className="mt-2 text-sm text-slate-600">{item.note}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
