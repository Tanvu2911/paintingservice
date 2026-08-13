import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import DashboardHeader from '../../../components/layout/DashboardHeader';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { paintingService } from '../../../util/paintingService';

export default function QuotationPage() {
  const { user, showToast } = useOutletContext();
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [quotedAmount, setQuotedAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [materialsSummary, setMaterialsSummary] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await paintingService.getJobs();
        setJobs(res.data || []);
        if ((res.data || []).length > 0) setSelectedJob(res.data[0].id);
      } catch {
        showToast?.('Không tải được danh sách công việc', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [showToast]);

  const handleSubmitQuote = async () => {
    try {
      await paintingService.createQuote({
        jobId: Number(selectedJob),
        quotedAmount: Number(quotedAmount),
        depositAmount: Number(depositAmount),
        materialsSummary,
        note: 'Báo giá được gửi từ giao diện quản trị',
      });
      showToast?.('Đã lưu báo giá thành công', 'success');
    } catch {
      showToast?.('Không lưu được báo giá', 'error');
    }
  };

  return (
    <div>
      <DashboardHeader title="Báo giá dịch vụ" subtitle="Nhập báo giá, cọc và danh mục vật liệu" userName={user?.username} userRole="Quản trị viên" avatarChar={(user?.username || 'A').charAt(0).toUpperCase()} />
      {loading ? <LoadingSpinner /> : (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <label className="mb-2 block text-sm font-semibold text-slate-600">Chọn công trình</label>
          <select value={selectedJob} onChange={(e) => setSelectedJob(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
            {jobs.map((job) => <option key={job.id} value={job.id}>#{job.id} - {job.title}</option>)}
          </select>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <input value={quotedAmount} onChange={(e) => setQuotedAmount(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Tổng báo giá (VNĐ)" />
            <input value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Tiền cọc (VNĐ)" />
          </div>
          <textarea value={materialsSummary} onChange={(e) => setMaterialsSummary(e.target.value)} rows="5" className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Liệt kê vật liệu cần mua..." />
          <button onClick={handleSubmitQuote} className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Lưu báo giá</button>
        </div>
      )}
    </div>
  );
}
