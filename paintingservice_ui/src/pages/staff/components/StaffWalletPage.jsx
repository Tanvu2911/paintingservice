import { useState, useEffect } from "react";
import { useOutletContext, Link, useLocation } from "react-router-dom";
import {
  Wallet,
  CreditCard,
  CheckCircle2,
  Clock,
  Building2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  ClipboardList,
} from "lucide-react";
import useWalletData from "../../../hooks/useWalletData";
import DataTable from "../../../components/common/DataTable";
import LoadingSpinner from "../../../components/common/LoadingSpinner";
import { formatMoney } from "../../../util/formatters";
import AxiosConfig from "../../../util/AxiosConfig";

function StaffWalletPage({ title, accent = "blue", roleLabel }) {
  const { user, showToast } = useOutletContext();
  const location = useLocation();
  const isTechnician = location.pathname.includes("/staff/technician");
  const profileLink = isTechnician ? "/staff/technician/profile" : "/staff/survey/profile";

  const { salaryHistory, balance, paidTotal, totalEarned, loading } =
    useWalletData(user?.id, showToast);

  const [staffInfo, setStaffInfo] = useState(null);
  const [loadingStaff, setLoadingStaff] = useState(true);

  useEffect(() => {
    const fetchStaffMe = async () => {
      try {
        setLoadingStaff(true);
        const res = await AxiosConfig.get("/staff/me");
        if (res.data) {
          setStaffInfo(res.data);
        }
      } catch (err) {
        console.error("Lỗi lấy thông tin ngân hàng nhân viên:", err);
      } finally {
        setLoadingStaff(false);
      }
    };
    fetchStaffMe();
  }, []);

  const columns = [
    {
      key: "bookingId",
      label: "Mã đơn hàng",
      render: (row) => (
        <span className="font-bold font-mono text-slate-900">
          #{row.bookingId}
        </span>
      ),
    },
    {
      key: "role",
      label: "Hạng mục / Vai trò",
      render: (row) => (
        <span className="text-xs font-semibold text-slate-700">
          {row.roleInBooking || roleLabel || "Nhân viên thực hiện"}
        </span>
      ),
    },
    {
      key: "amount",
      label: "Thù lao nhận được",
      render: (row) => (
        <span className="text-emerald-600 font-bold font-mono text-xs sm:text-sm">
          +{formatMoney(row.amountEarned)}
        </span>
      ),
    },
    {
      key: "status",
      label: "Trạng thái thanh toán",
      render: (row) => (
        <span
          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
            row.paymentStatus === "PAID"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-amber-50 text-amber-700 border border-amber-200"
          }`}
        >
          {row.paymentStatus === "PAID" ? (
            <>
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Đã chuyển khoản</span>
            </>
          ) : (
            <>
              <Clock className="w-3 h-3 text-amber-600" />
              <span>Chờ Admin thanh toán</span>
            </>
          )}
        </span>
      ),
    },
    {
      key: "date",
      label: "Ngày tính thù lao",
      render: (row) =>
        row.calculatedAt
          ? new Date(row.calculatedAt).toLocaleDateString("vi-VN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "—",
    },
  ];

  if (loading) return <LoadingSpinner />;

  const hasBankAccount =
    Boolean(staffInfo?.bankAccountNumber) && Boolean(staffInfo?.bankName);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {title || "Ví Thu Nhập & Thù Lao"}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi chi tiết thù lao, các khoản thanh toán đã nhận và tiến độ đối soát từ Quản trị viên (Admin).
          </p>
        </div>

        <Link
          to={profileLink}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs transition self-start sm:self-auto"
        >
          <CreditCard className="w-4 h-4 text-emerald-600" />
          <span>Cập nhật STK ngân hàng</span>
        </Link>
      </div>

      {/* Main Income Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          <div className="lg:col-span-2 space-y-3.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold border border-white/10 text-emerald-300">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Thu nhập tích lũy toàn thời gian</span>
            </div>

            <div>
              <p className="text-slate-400 text-xs font-medium">Tổng thu nhập đã phát sinh</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight mt-1 font-mono">
                {formatMoney(totalEarned)}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs text-slate-300">
              <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 px-3 py-1.5 rounded-xl font-bold border border-emerald-500/30">
                <CheckCircle2 className="w-4 h-4" />
                <span>Đã nhận chuyển khoản: {formatMoney(paidTotal)}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 px-3 py-1.5 rounded-xl font-bold border border-amber-500/30">
                <Clock className="w-4 h-4" />
                <span>Chờ thanh toán: {formatMoney(balance)}</span>
              </span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/10 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Quy trình thanh toán thù lao</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Admin đối soát và chuyển khoản trực tiếp vào STK ngân hàng của bạn theo từng đơn hàng đã hoàn tất. Bạn <strong>không cần tạo lệnh rút tiền</strong>.
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={() =>
                  document.getElementById("tx-history")?.scrollIntoView({ behavior: "smooth" })
                }
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                Xem chi tiết các đơn hàng
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Đã thanh toán (Admin đã CK)</span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-2 font-mono">
              {formatMoney(paidTotal)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Tiền đã về tài khoản ngân hàng của bạn</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-7 h-7" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Chờ thanh toán (Đang đối soát)</span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-amber-600 mt-2 font-mono">
              {formatMoney(balance)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Admin sẽ chuyển khoản trong đợt thanh toán kế tiếp</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-7 h-7" />
          </div>
        </div>
      </div>

      {/* Registered Bank Account Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
                Tài khoản ngân hàng nhận chuyển khoản thù lao
              </h3>
              <p className="text-[11px] text-slate-500">
                Tài khoản được sử dụng để Admin chuyển tiền thù lao cho bạn
              </p>
            </div>
          </div>

          <Link
            to={profileLink}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Thay đổi thông tin</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loadingStaff ? (
          <div className="p-4 text-center text-xs text-slate-400">Đang tải thông tin ngân hàng...</div>
        ) : hasBankAccount ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block text-[10.5px] uppercase font-bold">Ngân hàng</span>
              <span className="font-bold text-slate-800 text-sm mt-0.5 block truncate">
                {staffInfo.bankName}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10.5px] uppercase font-bold">Số tài khoản</span>
              <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block tracking-wider">
                {staffInfo.bankAccountNumber}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10.5px] uppercase font-bold">Chủ tài khoản</span>
              <span className="font-bold text-slate-800 text-sm mt-0.5 block uppercase truncate">
                {staffInfo.bankAccountName || user?.fullName || user?.username}
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-800">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Bạn chưa thiết lập tài khoản ngân hàng nhận tiền. Vui lòng cập nhật ngay để Admin có thể chuyển khoản thù lao.
              </span>
            </div>
            <Link
              to={profileLink}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shrink-0 text-center transition"
            >
              Thiết lập STK ngay
            </Link>
          </div>
        )}
      </div>

      {/* Transaction History Section */}
      <div id="tx-history" className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-slate-500" />
            <span>Lịch sử đối soát &amp; Chi trả thù lao</span>
          </h3>
          <span className="text-xs text-slate-400 font-semibold">
            {salaryHistory.length} bản ghi
          </span>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <DataTable
            columns={columns}
            data={salaryHistory}
            emptyMessage="Chưa có lịch sử thù lao nào được ghi nhận."
          />
        </div>
      </div>
    </div>
  );
}

export default StaffWalletPage;
