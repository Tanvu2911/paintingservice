// import { useState, useEffect } from "react";
// import { useOutletContext } from "react-router-dom";
// import AxiosConfig from "../../../util/AxiosConfig";
// import JobCard from "../components/JobCard";
// import LoadingSpinner from "../../../components/common/LoadingSpinner";

// /**
//  * Luồng đội thợ:
//  * CONTRACT_APPROVED  → Nhận việc / Từ chối
//  * ACCEPTED           → Bắt đầu thi công / Từ chối
//  * PROCESSING         → Xác nhận hoàn thành
//  * WORKER_COMPLETED   → Chờ GS + chủ nhà nghiệm thu (không còn nút)
//  */
// export default function TechnicianJobs() {
//   const { showToast } = useOutletContext();

//   const [jobs, setJobs] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [filter, setFilter] = useState("ALL");

//   const fetchJobs = async () => {
//     try {
//       setLoading(true);
//       const res = await AxiosConfig.get("/bookings/technician");
//       const data = res.data?.content || res.data || [];
//       setJobs(Array.isArray(data) ? data : []);
//     } catch (err) {
//       console.error(err);
//       showToast?.(
//         err.response?.data?.message || "Không tải được danh sách công trình",
//         "error"
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     let isMounted = true;

//     const loadData = async () => {
//       try {
//         const res = await AxiosConfig.get("/bookings/technician");
//         const data = res.data?.content || res.data || [];
//         if (isMounted) setJobs(Array.isArray(data) ? data : []);
//       } catch (err) {
//         console.error(err);
//         if (isMounted) {
//           showToast?.(
//             err.response?.data?.message ||
//               "Không tải được danh sách công trình",
//             "error"
//           );
//         }
//       } finally {
//         if (isMounted) setLoading(false);
//       }
//     };

//     loadData();
//     return () => {
//       isMounted = false;
//     };
//   }, [showToast]);

//   // 1. Nhận việc
//   const handleAccept = async (jobId) => {
//     if (!window.confirm("Xác nhận nhận công trình này?")) return;
//     try {
//       await AxiosConfig.post(`/bookings/${jobId}/accept-job`);
//       showToast?.("Đã nhận công trình thành công!");
//       await fetchJobs();
//     } catch (err) {
//       showToast?.(
//         err.response?.data?.message || "Không thể nhận công trình",
//         "error"
//       );
//     }
//   };

//   // 2. Từ chối
//   const handleReject = async (jobId) => {
//     const reason = window.prompt("Nhập lý do từ chối:");
//     if (reason === null) return;
//     try {
//       await AxiosConfig.post(`/bookings/${jobId}/reject-job`, { reason });
//       showToast?.("Đã từ chối công trình.");
//       await fetchJobs();
//     } catch (err) {
//       showToast?.(
//         err.response?.data?.message || "Không thể từ chối",
//         "error"
//       );
//     }
//   };

//   // 3. Bắt đầu thi công — chỉ khi HĐ đã duyệt / đã nhận việc
//   const handleStart = async (job) => {
//     const canStart = ["CONTRACT_APPROVED", "ACCEPTED"].includes(job.status);
//     if (!canStart) {
//       showToast?.(
//         "Chưa thể bắt đầu: cần HĐ đã duyệt và đã nhận việc.",
//         "error"
//       );
//       return;
//     }
//     if (!window.confirm("Bắt đầu thi công công trình này?")) return;
//     try {
//       await AxiosConfig.post(`/bookings/${job.id}/start-job`);
//       showToast?.("Đã bắt đầu thi công!");
//       await fetchJobs();
//     } catch (err) {
//       showToast?.(
//         err.response?.data?.message || "Không thể bắt đầu thi công",
//         "error"
//       );
//     }
//   };

//   // 4. Hoàn thành → WORKER_COMPLETED (chờ GS + chủ nhà nghiệm thu)
//   // 4. Thợ xong thi công → WORKER_COMPLETED (chờ nghiệm thu)
//   const handleComplete = async (jobId) => {
//     if (
//       !window.confirm(
//         "Xác nhận đã xong phần thi công?\nĐơn sẽ chuyển sang chờ Giám sát và Chủ nhà nghiệm thu (chưa hoàn tất)."
//       )
//     )
//       return;
//     try {
//       await AxiosConfig.post(`/bookings/${jobId}/complete-job`);
//       showToast?.(
//         "Đã báo hoàn thành thi công. Chờ giám sát & chủ nhà nghiệm thu.",
//         "success"
//       );
//       await fetchJobs();
//     } catch (err) {
//       showToast?.(
//         err.response?.data?.message || "Không thể xác nhận hoàn thành",
//         "error"
//       );
//     }
//   };

//   const filteredJobs = jobs.filter((job) => {
//     if (filter === "ALL") return true;
//     return job.status === filter;
//   });

//   if (loading) return <LoadingSpinner />;

//   return (
//     <div className="space-y-6">
//       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
//         <div>
//           <h1 className="text-2xl font-bold text-slate-800">
//             Danh sách thi công
//           </h1>
//           <p className="text-slate-500 text-sm">
//             Nhận việc · Từ chối · Bắt đầu làm · Xác nhận hoàn thành (chờ nghiệm
//             thu)
//           </p>
//         </div>

//         <select
//           value={filter}
//           onChange={(e) => setFilter(e.target.value)}
//           className="border rounded-xl px-3 py-2 bg-white text-sm"
//         >
//           <option value="ALL">Tất cả</option>
//           <option value="CONTRACT_APPROVED">Chờ nhận việc</option>
//           <option value="ACCEPTED">Đã nhận việc</option>
//           <option value="PROCESSING">Đang thi công</option>
//           <option value="WORKER_COMPLETED">Chờ nghiệm thu</option>
//           <option value="COMPLETED">Hoàn tất</option>
//           <option value="CANCELLED">Đã hủy</option>
//         </select>
//       </div>

//       {filteredJobs.length === 0 ? (
//         <div className="bg-white rounded-2xl p-12 text-center border text-slate-400">
//           Chưa có công trình nào.
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
//           {filteredJobs.map((job) => (
//             <JobCard
//               key={job.id}
//               job={job}
//               onAccept={() => handleAccept(job.id)}
//               onReject={() => handleReject(job.id)}
//               onStart={() => handleStart(job)}
//               onComplete={() => handleComplete(job.id)}
//             />
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

import { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import AxiosConfig from "../../../util/AxiosConfig";
import JobCard from "../components/JobCard";
import LoadingSpinner from "../../../components/common/LoadingSpinner";

/**
 * Luồng đội thợ (khớp BookingController):
 * CONTRACT_APPROVED  → Nhận việc / Từ chối
 * ACCEPTED           → Bắt đầu thi công
 * PROCESSING         → Xác nhận hoàn thành → WORKER_COMPLETED
 * WORKER_COMPLETED   → Chờ Giám sát + Chủ nhà nghiệm thu (BookingDetail)
 */
export default function TechnicianJobs() {
  const { showToast } = useOutletContext();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  // =========================================================
  // LOAD JOBS
  // =========================================================
  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await AxiosConfig.get("/bookings/technician");
      const data = res.data?.content || res.data || [];
      setJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
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
    let isMounted = true;

    const loadData = async () => {
      try {
        const res = await AxiosConfig.get("/bookings/technician");
        const data = res.data?.content || res.data || [];
        if (isMounted) {
          setJobs(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error(err);
        if (isMounted) {
          showToast?.(
            err.response?.data?.message ||
              "Không tải được danh sách công trình",
            "error"
          );
          setJobs([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [showToast]);

  // =========================================================
  // 1. NHẬN VIỆC  →  POST /bookings/{id}/accept-job
  // =========================================================
  const handleAccept = async (jobId) => {
    if (!window.confirm("Xác nhận nhận công trình này?")) return;

    try {
      await AxiosConfig.post(`/bookings/${jobId}/accept-job`);
      showToast?.("Đã nhận công trình thành công!", "success");
      await fetchJobs();
    } catch (err) {
      showToast?.(
        err.response?.data?.message || "Không thể nhận công trình",
        "error"
      );
    }
  };

  // =========================================================
  // 2. TỪ CHỐI  →  POST /bookings/{id}/reject-job
  // =========================================================
  const handleReject = async (jobId) => {
    const reason = window.prompt("Nhập lý do từ chối:");
    if (reason === null) return;
    if (!reason.trim()) {
      showToast?.("Vui lòng nhập lý do từ chối", "error");
      return;
    }

    try {
      await AxiosConfig.post(`/bookings/${jobId}/reject-job`, {
        reason: reason.trim(),
      });
      showToast?.("Đã từ chối công trình.", "success");
      await fetchJobs();
    } catch (err) {
      showToast?.(
        err.response?.data?.message || "Không thể từ chối",
        "error"
      );
    }
  };

  // =========================================================
  // 3. BẮT ĐẦU THI CÔNG  →  POST /bookings/{id}/start-job
  // Chỉ cho phép khi status = CONTRACT_APPROVED hoặc ACCEPTED
  // =========================================================
  const handleStart = async (job) => {
    const canStart = ["CONTRACT_APPROVED", "ACCEPTED"].includes(job.status);
    if (!canStart) {
      showToast?.(
        "Chưa thể bắt đầu: cần Hợp đồng đã duyệt và đã nhận việc.",
        "error"
      );
      return;
    }

    if (!window.confirm("Bắt đầu thi công công trình này?")) return;

    try {
      await AxiosConfig.post(`/bookings/${job.id}/start-job`);
      showToast?.("Đã bắt đầu thi công!", "success");
      await fetchJobs();
    } catch (err) {
      showToast?.(
        err.response?.data?.message || "Không thể bắt đầu thi công",
        "error"
      );
    }
  };

  // =========================================================
  // 4. HOÀN THÀNH THI CÔNG  →  POST /bookings/{id}/complete-job
  // Status chuyển sang WORKER_COMPLETED
  // Sau đó Giám sát + Chủ nhà nghiệm thu qua BookingDetail
  // =========================================================
  const handleComplete = async (jobId) => {
    if (
      !window.confirm(
        "Xác nhận đã xong phần thi công?\n\n" +
          "Đơn sẽ chuyển sang trạng thái WORKER_COMPLETED\n" +
          "và chờ Giám sát + Chủ nhà nghiệm thu."
      )
    ) {
      return;
    }

    try {
      await AxiosConfig.post(`/bookings/${jobId}/complete-job`);
      showToast?.(
        "Đã báo hoàn thành thi công. Chờ giám sát & chủ nhà nghiệm thu.",
        "success"
      );
      await fetchJobs();
    } catch (err) {
      showToast?.(
        err.response?.data?.message || "Không thể xác nhận hoàn thành",
        "error"
      );
    }
  };

  // =========================================================
  // FILTER
  // =========================================================
  const filteredJobs = jobs.filter((job) => {
    if (filter === "ALL") return true;
    return job.status === filter;
  });

  // =========================================================
  // RENDER
  // =========================================================
  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Danh sách thi công
          </h1>
          <p className="text-slate-500 text-sm">
            Nhận việc · Từ chối · Bắt đầu làm · Xác nhận hoàn thành (chờ nghiệm
            thu)
          </p>
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border rounded-xl px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">Tất cả</option>
          <option value="CONTRACT_APPROVED">Chờ nhận việc</option>
          <option value="ACCEPTED">Đã nhận việc</option>
          <option value="PROCESSING">Đang thi công</option>
          <option value="WORKER_COMPLETED">Chờ nghiệm thu</option>
          <option value="COMPLETED">Hoàn tất</option>
          <option value="CANCELLED">Đã hủy</option>
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
              onAccept={() => handleAccept(job.id)}
              onReject={() => handleReject(job.id)}
              onStart={() => handleStart(job)}
              onComplete={() => handleComplete(job.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}