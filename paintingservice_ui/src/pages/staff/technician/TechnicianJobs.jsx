import { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import AxiosConfig from "../../../util/AxiosConfig";
import JobCard from "../components/JobCard";
import LoadingSpinner from "../../../components/common/LoadingSpinner";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import PromptDialog from "../../../components/common/PromptDialog";

export default function TechnicianJobs() {
  const { showToast } = useOutletContext();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  const [confirmAction, setConfirmAction] = useState(null);
  const [promptReject, setPromptReject] = useState(null);

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await AxiosConfig.get("/bookings/technician");
      const data = res.data?.content || res.data || [];
      setJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast?.(
        err.response?.data?.message || "Không tải được danh sách công trình",
        "error"
      );
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleAccept = async (jobId) => {
    setConfirmAction({
      type: "accept",
      jobId,
      title: "Nhận công trình",
      message: "Xác nhận nhận công trình này?",
    });
  };

  const handleReject = (jobId) => {
    setPromptReject({ jobId });
  };

  const handleStart = (job) => {
    setConfirmAction({
      type: "start",
      job,
      title: "Bắt đầu thi công",
      message: "Bắt đầu thi công công trình này?",
    });
  };

  const handleComplete = (jobId) => {
    setConfirmAction({
      type: "complete",
      jobId,
      title: "Hoàn thành thi công",
      message:
        "Xác nhận đã xong phần thi công?\nĐơn sẽ chuyển sang chờ Giám sát + Chủ nhà nghiệm thu.",
    });
  };

  const executeConfirm = async () => {
    if (!confirmAction) return;
    try {
      if (confirmAction.type === "accept") {
        await AxiosConfig.post(`/bookings/${confirmAction.jobId}/accept-job`);
        showToast?.("Đã nhận công trình thành công!", "success");
      } else if (confirmAction.type === "start") {
        const job = confirmAction.job;
        if (!["CONTRACT_APPROVED", "ACCEPTED"].includes(job.status)) {
          showToast?.("Chưa thể bắt đầu: cần đã nhận việc.", "error");
          return;
        }
        await AxiosConfig.post(`/bookings/${job.id}/start-job`);
        showToast?.("Đã bắt đầu thi công!", "success");
      } else if (confirmAction.type === "complete") {
        await AxiosConfig.post(`/bookings/${confirmAction.jobId}/complete-job`);
        showToast?.(
          "Đã báo hoàn thành thi công. Chờ giám sát & chủ nhà nghiệm thu.",
          "success"
        );
      }
      await fetchJobs();
    } catch (err) {
      showToast?.(
        err.response?.data?.message || "Không thể thực hiện thao tác",
        "error"
      );
    } finally {
      setConfirmAction(null);
    }
  };

  const submitReject = async (reason) => {
    if (!promptReject) return;
    if (!reason.trim()) {
      showToast?.("Vui lòng nhập lý do từ chối", "error");
      return;
    }
    try {
      await AxiosConfig.post(`/bookings/${promptReject.jobId}/reject-job`, {
        reason: reason.trim(),
      });
      showToast?.("Đã từ chối công trình.", "success");
      setPromptReject(null);
      await fetchJobs();
    } catch (err) {
      showToast?.(
        err.response?.data?.message || "Không thể từ chối",
        "error"
      );
    }
  };

  const filteredJobs = jobs.filter((job) => {
    if (filter === "ALL") return true;
    return job.status === filter;
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Danh sách thi công</h1>
          <p className="text-slate-500 text-sm">
            Nhận việc · Bắt đầu thi công · Hoàn thành
          </p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border rounded-xl px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="ALL">Tất cả</option>
          <option value="CONTRACT_APPROVED">Chưa nhận việc</option>
          <option value="ACCEPTED">Đã nhận việc</option>
          <option value="PROCESSING">Đang thi công</option>
          <option value="WORKER_COMPLETED">Chờ nghiệm thu</option>
          <option value="WORKER_REJECTED">Từ chối</option>
          <option value="COMPLETED">Hoàn tất</option>
        </select>
      </div>

      {filteredJobs.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border text-slate-400">
          Chưa có công trình nào.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onAccept={handleAccept}
              onReject={handleReject}
              onStart={handleStart}
              onComplete={handleComplete}
            // Không còn onReport / onViewReports
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(confirmAction)}
        onClose={() => setConfirmAction(null)}
        onConfirm={executeConfirm}
        title={confirmAction?.title}
        message={confirmAction?.message}
      />

      <PromptDialog
        isOpen={Boolean(promptReject)}
        onClose={() => setPromptReject(null)}
        onSubmit={submitReject}
        title="Từ chối công trình"
        message="Nhập lý do từ chối:"
        placeholder="Lý do từ chối..."
      />
    </div>
  );
}