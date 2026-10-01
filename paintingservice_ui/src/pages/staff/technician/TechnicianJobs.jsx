import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import AxiosConfig from "../../../util/AxiosConfig";
import JobCard from "../components/JobCard";
import TechnicianJobDetailModal from "./components/TechnicianJobDetailModal";
import ImageLightboxModal from "../../../components/common/ImageLightboxModal";
import LoadingSpinner from "../../../components/common/LoadingSpinner";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import PromptDialog from "../../../components/common/PromptDialog";
import StatusBadge from "../../../components/common/StatusBadge";
import Pagination from "../../../components/common/Pagination";
import { formatMoney } from "../../../util/formatters";
import { formatDate } from "../../../util/orderFlowUtils";
import { HANOI_DISTRICTS, parseHanoiAddress } from "../../../data/hanoiLocations";
import { getTechWorkflowState } from "../../../util/technicianWorkflow";
import {
  Search,
  RefreshCw,
  Hammer,
  CheckCircle2,
  Clock,
  Briefcase,
  Wrench,
  X,
  List,
  LayoutGrid,
  MapPin,
  User,
  Phone,
  Calendar,
  Wallet,
  Check,
  Play,
  Sparkles,
  AlertTriangle,
  XCircle,
  Eye,
} from "lucide-react";

export default function TechnicianJobs() {
  const context = useOutletContext() || {};
  const showToast = context.showToast;
  const currentUser = context.user || JSON.parse(localStorage.getItem("user") || "{}");

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & State
  const [filter, setFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [sortOrder, setSortOrder] = useState("newest"); // 'newest' | 'oldest' | 'price_desc' | 'price_asc'
  const [viewMode, setViewMode] = useState("table"); // 'table' | 'grid'

  // Detail Modal State
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [viewTab, setViewTab] = useState("info");
  const [selectedPreviewImage, setSelectedPreviewImage] = useState(null);

  const openDetail = async (job) => {
    setSelectedJob(job);
    setViewTab("info");
    try {
      setLoadingDetail(true);
      const res = await AxiosConfig.get(`/bookings/${job.id}`);
      setSelectedDetail(res.data);
    } catch {
      setSelectedDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const splitImageUrls = (raw) => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  };

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Dialogs
  const [confirmAction, setConfirmAction] = useState(null);
  const [promptReject, setPromptReject] = useState(null);
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  const fetchJobs = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const res = await AxiosConfig.get("/bookings/technician");
        const data = res.data?.content || res.data || [];
        setJobs(Array.isArray(data) ? data : []);
        if (isRefresh) showToast?.("Đã làm mới danh sách công việc!", "success");
      } catch (err) {
        showToast?.(
          err.response?.data?.message || "Không tải được danh sách công trình",
          "error"
        );
        setJobs([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleAccept = async (jobId) => {
    setConfirmAction({
      type: "accept",
      jobId,
      title: "Xác nhận nhận công trình",
      message: "Bạn xác nhận tiếp nhận thi công công trình này?",
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
      message: "Bạn xác nhận đã có mặt tại công trình và bắt đầu triển khai thi công?",
    });
  };

  const handleComplete = (jobId) => {
    setConfirmAction({
      type: "complete",
      jobId,
      title: "Xác nhận hoàn thành thi công",
      message:
        "Bạn xác nhận toàn bộ hạng mục sơn sửa đã hoàn tất?\n\nĐơn sẽ chuyển sang giai đoạn chờ Giám sát và Khách hàng nghiệm thu thực tế.",
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
        await AxiosConfig.post(`/bookings/${job.id}/start-job`);
        showToast?.("Đã bắt đầu thi công công trình!", "success");
      } else if (confirmAction.type === "complete") {
        await AxiosConfig.post(`/bookings/${confirmAction.jobId}/complete-job`);
        showToast?.(
          "Đã báo hoàn thành thi công! Hệ thống đã gửi yêu cầu nghiệm thu.",
          "success"
        );
      }
      await fetchJobs();
      if (selectedJob) {
        const res = await AxiosConfig.get(`/bookings/${selectedJob.id}`);
        setSelectedJob(res.data);
      }
    } catch (err) {
      showToast?.(
        err.response?.data?.message || "Không thể thực hiện thao tác",
        "error"
      );
    } finally {
      setConfirmAction(null);
    }
  };

  const handleCompleteServiceItem = async (serviceItemId, note) => {
    if (!selectedJob) return;
    try {
      await AxiosConfig.post(
        `/bookings/${selectedJob.id}/services/${serviceItemId}/complete-job`,
        { note: note || "Đã thi công hoàn tất đúng yêu cầu kỹ thuật" }
      );
      showToast?.("Đã báo hoàn thành gói dịch vụ thành công!", "success");
      await fetchJobs();
      const res = await AxiosConfig.get(`/bookings/${selectedJob.id}`);
      setSelectedJob(res.data);
    } catch (err) {
      showToast?.(
        err.response?.data?.message || "Không thể báo hoàn thành gói này",
        "error"
      );
    }
  };

  const submitReject = async (reason) => {
    if (!promptReject) return;
    const trimmed = (reason || "").trim();
    if (!trimmed) {
      showToast?.("Vui lòng nhập lý do từ chối", "error");
      return;
    }
    try {
      setIsSubmittingReject(true);
      await AxiosConfig.post(`/bookings/${promptReject.jobId}/reject-job`, {
        reason: trimmed,
      });
      showToast?.("Đã từ chối tiếp nhận công trình.", "success");
      setPromptReject(null);
      await fetchJobs();
    } catch (err) {
      showToast?.(
        err.response?.data?.message || "Không thể từ chối công trình này",
        "error"
      );
    } finally {
      setIsSubmittingReject(false);
    }
  };

  // Stats / Counts
  const stats = useMemo(() => {
    const total = jobs.length;
    let pending = 0;
    let accepted = 0;
    let processing = 0;
    let waitingAcceptance = 0;
    let completed = 0;
    let cancelled = 0;

    jobs.forEach((j) => {
      const { myStatus, canAccept, isDone, isCancelled } = getTechWorkflowState(j, currentUser);
      if (canAccept || ["CONTRACT_APPROVED", "DEPOSIT_CONFIRMED", "ASSIGNED"].includes(myStatus)) {
        pending++;
      } else if (myStatus === "ACCEPTED") {
        accepted++;
      } else if (myStatus === "PROCESSING") {
        processing++;
      } else if (myStatus === "WORKER_COMPLETED") {
        waitingAcceptance++;
      } else if (isDone || ["WAITING_FINAL_PAYMENT", "COMPLETED", "PAID_TO_STAFF"].includes(myStatus)) {
        completed++;
      } else if (isCancelled || ["CANCELLED", "WORKER_REJECTED"].includes(myStatus)) {
        cancelled++;
      }
    });

    return { total, pending, accepted, processing, waitingAcceptance, completed, cancelled };
  }, [jobs, currentUser]);

  // Filter & Search & Sort
  const filteredJobs = useMemo(() => {
    let list = [...jobs];

    // 1. Status Filter
    if (filter !== "ALL") {
      list = list.filter((j) => {
        const { myStatus, canAccept, isDone, isCancelled } = getTechWorkflowState(j, currentUser);
        if (filter === "PENDING") {
          return canAccept || ["CONTRACT_APPROVED", "DEPOSIT_CONFIRMED", "ASSIGNED"].includes(myStatus);
        } else if (filter === "ACCEPTED") {
          return myStatus === "ACCEPTED";
        } else if (filter === "PROCESSING") {
          return myStatus === "PROCESSING";
        } else if (filter === "WORKER_COMPLETED") {
          return myStatus === "WORKER_COMPLETED";
        } else if (filter === "COMPLETED") {
          return isDone || ["WAITING_FINAL_PAYMENT", "COMPLETED", "PAID_TO_STAFF"].includes(myStatus);
        } else if (filter === "CANCELLED") {
          return isCancelled || ["CANCELLED", "WORKER_REJECTED"].includes(myStatus);
        }
        return true;
      });
    }

    // 2. Hanoi District Filter
    if (selectedDistrict) {
      list = list.filter((j) => {
        const parsed = parseHanoiAddress(j.address || "");
        return parsed.district === selectedDistrict;
      });
    }

    // 3. Keyword Search
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      list = list.filter(
        (j) =>
          String(j.id).includes(q) ||
          (j.serviceName || j.service?.name || "").toLowerCase().includes(q) ||
          (j.address || "").toLowerCase().includes(q) ||
          (j.customerName || "").toLowerCase().includes(q)
      );
    }

    // 4. Sort
    list.sort((a, b) => {
      if (sortOrder === "newest") {
        const dateA = new Date(a.expectedStartDate || a.appointmentDate || a.createdAt || 0).getTime();
        const dateB = new Date(b.expectedStartDate || b.appointmentDate || b.createdAt || 0).getTime();
        return dateB - dateA;
      }
      if (sortOrder === "oldest") {
        const dateA = new Date(a.expectedStartDate || a.appointmentDate || a.createdAt || 0).getTime();
        const dateB = new Date(b.expectedStartDate || b.appointmentDate || b.createdAt || 0).getTime();
        return dateA - dateB;
      }
      if (sortOrder === "price_desc") {
        return Number(b.totalAmount || 0) - Number(a.totalAmount || 0);
      }
      if (sortOrder === "price_asc") {
        return Number(a.totalAmount || 0) - Number(a.totalAmount || 0);
      }
      return Number(b.id) - Number(a.id);
    });

    return list;
  }, [jobs, searchTerm, filter, selectedDistrict, sortOrder]);

  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage) || 1;
  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredJobs.slice(start, start + itemsPerPage);
  }, [filteredJobs, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filter, selectedDistrict, sortOrder]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900">
              Công Việc Đội Thợ Thi Công
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tiếp nhận công trình, triển khai thi công và báo hoàn tất nhận thù lao 60%.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchJobs(true)}
            disabled={refreshing}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-amber-600" : ""}`} />
            <span>Làm mới danh sách</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Status Filter Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {[
            { key: "ALL", label: "Tất cả", count: stats.total },
            { key: "PENDING", label: "Chờ nhận việc", count: stats.pending },
            { key: "ACCEPTED", label: "Đã nhận việc", count: stats.accepted },
            { key: "PROCESSING", label: "Đang thi công", count: stats.processing },
            { key: "WORKER_COMPLETED", label: "Chờ nghiệm thu", count: stats.waitingAcceptance },
            { key: "COMPLETED", label: "Hoàn tất", count: stats.completed },
            { key: "CANCELLED", label: "Đã hủy / Từ chối", count: stats.cancelled },
          ].map((tab) => {
            const active = filter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter(tab.key)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  active
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    active
                      ? "bg-white/20 text-white"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Search, District Filter, Sort & View Mode Switcher */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Ô Tìm kiếm */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Tìm theo #Mã đơn, dịch vụ, địa chỉ, khách hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Lọc Quận/Huyện Hà Nội */}
          <div className="w-full md:w-52">
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
            >
              <option value="">Khu vực: Tất cả Hà Nội</option>
              {HANOI_DISTRICTS.map((d) => (
                <option key={d.name} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sắp xếp */}
          <div className="w-full md:w-48">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
            >
              <option value="newest">Ngày thi công mới nhất</option>
              <option value="oldest">Ngày thi công cũ nhất</option>
              <option value="price_desc">Thù lao cao nhất</option>
              <option value="price_asc">Thù lao thấp nhất</option>
            </select>
          </div>

          {/* View Mode Toggle: Table vs Grid */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 self-end md:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === "table"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Dạng bảng chi tiết"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Bảng</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === "grid"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Dạng thẻ lưới"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Thẻ</span>
            </button>
          </div>
        </div>

        {/* Thống kê kết quả */}
        <div className="flex justify-between items-center text-xs text-slate-500 pt-1">
          <span>
            Tìm thấy <strong>{filteredJobs.length}</strong> / {jobs.length} công trình phù hợp
          </span>
          {(selectedDistrict || searchTerm || filter !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setSelectedDistrict("");
                setSearchTerm("");
                setFilter("ALL");
              }}
              className="text-emerald-700 hover:text-emerald-900 font-bold hover:underline cursor-pointer"
            >
              Xóa tất cả bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* 4. Jobs List (Table View or Grid View) */}
      {loading ? (
        <LoadingSpinner />
      ) : filteredJobs.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3 shadow-xs">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-3xl flex items-center justify-center mx-auto">
            <Wrench className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">Không tìm thấy công trình nào</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Chưa có công trình nào phù hợp với bộ lọc hiện tại. Thử đổi trạng thái hoặc tìm từ khóa khác.
          </p>
        </div>
      ) : viewMode === "table" ? (
        /* TABLE VIEW (Chuẩn như trang Admin) */
        <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-slate-400 uppercase text-[10px] font-black tracking-wider border-b border-slate-100">
                  <th className="py-3 px-4">Công trình &amp; Dịch vụ</th>
                  <th className="py-3 px-4">Khách hàng</th>
                  <th className="py-3 px-4">Địa chỉ thi công</th>
                  <th className="py-3 px-4">Thù lao nhận được</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedJobs.map((job) => {
                  const techState = getTechWorkflowState(job, currentUser);
                  const {
                    myStatus,
                    canAccept,
                    canReject,
                    canStart,
                    canComplete,
                    isWaitingAcceptance,
                    isDone,
                    isCancelled,
                  } = techState;
                  const status = myStatus || job.status || "";
                  const parsed = parseHanoiAddress(job.address);
                  const workerPayout = Number(job.totalAmount || 0) * 0.60;

                  return (
                    <tr
                      key={job.id}
                      onClick={() => openDetail(job)}
                      className="hover:bg-slate-50/80 transition group cursor-pointer"
                    >
                      {/* 1. Mã & Dịch vụ */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className="font-mono text-emerald-700 group-hover:text-emerald-800 transition">
                            #{job.id}
                          </span>
                          <span className="text-slate-300">·</span>
                          <span className="text-slate-800 truncate max-w-[140px]">
                            {job.serviceName || job.service?.name || "Sơn sửa nhà"}
                          </span>
                        </div>
                        {(job.expectedStartDate || job.appointmentDate) && (
                          <div className="text-[10.5px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>Ngày hẹn: {formatDate(job.expectedStartDate || job.appointmentDate)}</span>
                          </div>
                        )}
                      </td>

                      {/* 2. Khách hàng */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="font-bold text-slate-900 truncate max-w-[130px]">
                          {job.customerName || job.customer?.username || "Khách hàng"}
                        </div>
                        {job.customerPhone ? (
                          <a
                            href={`tel:${job.customerPhone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-[11px] text-slate-500 hover:text-emerald-700 flex items-center gap-1 mt-0.5"
                          >
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{job.customerPhone}</span>
                          </a>
                        ) : (
                          <span className="text-[11px] text-slate-400">—</span>
                        )}
                      </td>

                      {/* 3. Địa chỉ & Khu vực */}
                      <td className="py-3.5 px-4 align-middle max-w-[200px]">
                        <div className="text-slate-700 font-medium text-xs truncate" title={job.address}>
                          {job.address || "Địa chỉ công trình"}
                        </div>
                        {parsed.district && (
                          <div className="mt-0.5">
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                              <MapPin className="w-2.5 h-2.5 text-emerald-600" />
                              <span>{parsed.district}</span>
                            </span>
                          </div>
                        )}
                      </td>

                      {/* 4. Thù lao nhận được */}
                      <td className="py-3.5 px-4 align-middle">
                        {workerPayout > 0 ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 font-bold text-xs font-mono border border-emerald-100">
                            <Wallet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{formatMoney(workerPayout)}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Chưa có dự toán</span>
                        )}
                      </td>

                      {/* 5. Trạng thái */}
                      <td className="py-3.5 px-4 align-middle">
                        <StatusBadge status={status} />
                      </td>

                      {/* 6. Thao tác */}
                      <td className="py-3.5 px-4 align-middle text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {canAccept && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleAccept(job.id)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-xs cursor-pointer flex items-center gap-1 text-xs"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Nhận việc</span>
                              </button>
                              {canReject && (
                                <button
                                  type="button"
                                  onClick={() => handleReject(job.id)}
                                  className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold transition cursor-pointer flex items-center gap-1 text-xs"
                                  title="Từ chối nhận việc"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Từ chối</span>
                                </button>
                              )}
                            </>
                          )}

                          {canStart && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleStart(job)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5 text-xs"
                              >
                                <Play className="w-3.5 h-3.5 fill-current" />
                                <span>Bắt đầu làm</span>
                              </button>
                              {canReject && (
                                <button
                                  type="button"
                                  onClick={() => handleReject(job.id)}
                                  className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold transition cursor-pointer flex items-center gap-1 text-xs"
                                  title="Từ chối nhận việc"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Từ chối</span>
                                </button>
                              )}
                            </>
                          )}

                          {canComplete && (
                            <button
                              type="button"
                              onClick={() => handleComplete(job.id)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black transition shadow-xs cursor-pointer flex items-center gap-1.5 text-xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Báo hoàn thành</span>
                            </button>
                          )}

                          {isWaitingAcceptance && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-xl border border-teal-200">
                              <Clock className="w-3 h-3 text-teal-600" />
                              <span>Chờ nghiệm thu</span>
                            </span>
                          )}

                          {isDone && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                              <Sparkles className="w-3 h-3 text-emerald-600" />
                              <span>Hoàn tất</span>
                            </span>
                          )}

                          {isCancelled && (
                            <span className="text-[11px] text-slate-400 font-medium italic">
                              {status === "WORKER_REJECTED" ? "Đã từ chối" : "Đã hủy"}
                            </span>
                          )}

                          {/* Nút Xem chi tiết */}
                          <button
                            type="button"
                            onClick={() => openDetail(job)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 transition cursor-pointer shadow-xs flex items-center gap-1 text-xs"
                            title="Xem chi tiết công trình"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>Chi tiết</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID VIEW (Dạng thẻ JobCard) */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {paginatedJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              currentUser={currentUser}
              onAccept={handleAccept}
              onReject={handleReject}
              onStart={handleStart}
              onComplete={handleComplete}
              onViewDetail={openDetail}
            />
          ))}
        </div>
      )}

      {/* 5. Phân trang Pagination */}
      {filteredJobs.length > itemsPerPage && (
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredJobs.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Technician Job Detail Modal */}
      <TechnicianJobDetailModal
        selectedJob={selectedJob}
        selectedDetail={selectedDetail}
        loadingDetail={loadingDetail}
        viewTab={viewTab}
        setViewTab={setViewTab}
        splitImageUrls={splitImageUrls}
        setSelectedPreviewImage={setSelectedPreviewImage}
        closeModal={() => {
          setSelectedJob(null);
          setSelectedDetail(null);
        }}
        onAccept={handleAccept}
        onReject={handleReject}
        onStart={handleStart}
        onComplete={handleComplete}
        currentUser={context.user}
        onCompleteServiceItem={handleCompleteServiceItem}
      />

      {/* Lightbox Modal */}
      {selectedPreviewImage && (
        <ImageLightboxModal
          isOpen={!!selectedPreviewImage}
          imageSrc={selectedPreviewImage}
          onClose={() => setSelectedPreviewImage(null)}
        />
      )}

      {/* Confirm Action Dialog */}
      <ConfirmDialog
        isOpen={!!confirmAction}
        title={confirmAction?.title || "Xác nhận"}
        message={confirmAction?.message || ""}
        onConfirm={executeConfirm}
        onClose={() => setConfirmAction(null)}
        confirmText={
          confirmAction?.type === "accept"
            ? "Nhận việc"
            : confirmAction?.type === "start"
            ? "Bắt đầu làm"
            : "Báo hoàn thành"
        }
        confirmColor={
          confirmAction?.type === "start"
            ? "bg-amber-500 hover:bg-amber-600 text-slate-950"
            : "bg-emerald-600 hover:bg-emerald-700 text-white"
        }
      />

      {/* Prompt Reject Dialog */}
      <PromptDialog
        isOpen={!!promptReject}
        title="Từ chối nhận công trình"
        message="Vui lòng nhập lý do từ chối để Admin có thể phân công đội thợ khác:"
        placeholder="Ví dụ: Đội thợ đang bận công trình khác, địa điểm quá xa..."
        onSubmit={submitReject}
        onConfirm={submitReject}
        submitting={isSubmittingReject}
        submitText="Xác nhận từ chối"
        submitColor="bg-rose-600 hover:bg-rose-700 text-white"
        onClose={() => setPromptReject(null)}
      />
    </div>
  );
}