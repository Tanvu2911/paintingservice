// import { Link } from "react-router-dom";
// import {
//   isAdmin,
//   isSurveyStaff,
//   isTechnicianStaff,
//   isCustomer,
//   getRedirectPath,
// } from "../../util/roleUtils";

// export default function RoleQuickNav({ user }) {
//   if (!user) {
//     return (
//       <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
//         <p className="text-sm text-blue-800">
//           Đăng nhập để quản lý yêu cầu, thanh toán và theo dõi tiến độ.
//         </p>
//         <div className="flex gap-2">
//           <Link
//             to="/login"
//             className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700"
//           >
//             Đăng nhập
//           </Link>
//           <Link
//             to="/register"
//             className="px-4 py-2 bg-white text-blue-600 text-sm font-semibold rounded-xl border border-blue-200 hover:bg-blue-50"
//           >
//             Đăng ký
//           </Link>
//         </div>
//       </div>
//     );
//   }

//   if (isAdmin(user)) {
//     return (
//       <div className="bg-slate-900 text-white rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
//         <div>
//           <p className="font-bold">Xin chào, {user.username}!</p>
//           <p className="text-sm text-slate-300">Quản trị viên hệ thống</p>
//         </div>
//         <div className="flex flex-wrap gap-2">
//           <NavLink to="/admin/dashboard" label="Dashboard" />
//           <NavLink to="/admin/employees" label="Tài khoản" />
//           <NavLink to="/admin/revenue" label="Doanh thu" />
//           <NavLink to="/admin/wallet" label="Ví hệ thống" />
//         </div>
//       </div>
//     );
//   }

//   if (isSurveyStaff(user)) {
//     return (
//       <StaffNav
//         user={user}
//         title="Khảo sát viên"
//         color="blue"
//         basePath="/staff/survey"
//         links={[
//           { to: "/staff/survey/dashboard", label: "Tổng quan" },
//           { to: "/staff/survey/jobs", label: "Lịch đang yêu cầu" },
//           { to: "/staff/survey/history", label: "Lịch đã yêu cầu" },
//           { to: "/staff/survey/wallet", label: "Ví thu nhập" },
//           { to: "/staff/survey/profile", label: "Tài khoản" },
//         ]}
//       />
//     );
//   }

//   if (isTechnicianStaff(user)) {
//     return (
//       <StaffNav
//         user={user}
//         title="Kỹ thuật viên thi công"
//         color="amber"
//         basePath="/staff/technician"
//         links={[
//           { to: "/staff/technician/dashboard", label: "Tổng quan" },
//           { to: "/staff/technician/jobs", label: "Công việc đang làm" },
//           { to: "/staff/technician/history", label: "Lịch sử thi công" },
//           { to: "/staff/technician/wallet", label: "Ví & hoa hồng" },
//           { to: "/staff/technician/profile", label: "Tài khoản" },
//         ]}
//       />
//     );
//   }

//   if (isCustomer(user)) {
//     return (
//       <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 space-y-3">
//         <div>
//           <p className="font-bold text-emerald-900">
//             Xin chào, {user.fullName || user.username}!
//           </p>
//           <p className="text-sm text-emerald-700">Khách hàng</p>
//         </div>
//         <div className="flex flex-wrap gap-2">
//           <NavLink to="/customer/history" label="Lịch sử yêu cầu" emerald />
//           <NavLink to="/customer/wallet" label="Ví thanh toán" emerald />
//           <NavLink to="/customer/profile" label="Tài khoản" emerald />
//           <NavLink to="/home#booking" label="Tạo yêu cầu mới" emerald />
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="bg-slate-50 rounded-2xl p-4 text-sm text-slate-600">
//       <Link to={getRedirectPath(user)} className="text-blue-600 font-semibold hover:underline">
//         Vào trang quản lý →
//       </Link>
//     </div>
//   );
// }

// function NavLink({ to, label, emerald }) {
//   return (
//     <Link
//       to={to}
//       className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
//         emerald
//           ? "bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
//           : "bg-white/10 text-white border border-white/20 hover:bg-white/20"
//       }`}
//     >
//       {label}
//     </Link>
//   );
// }

// function StaffNav({ user, title, links }) {
//   return (
//     <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
//       <div>
//         <p className="font-bold text-slate-800">
//           Xin chào, {user.fullName || user.username}!
//         </p>
//         <p className="text-sm text-slate-500">{title}</p>
//       </div>
//       <div className="flex flex-wrap gap-2">
//         {links.map((link) => (
//           <Link
//             key={link.to}
//             to={link.to}
//             className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition"
//           >
//             {link.label}
//           </Link>
//         ))}
//       </div>
//     </div>
//   );
// }


import { Link, useLocation } from "react-router-dom";
import {
  isAdmin,
  isSurveyStaff,
  isTechnicianStaff,
  isCustomer,
  getRedirectPath,
} from "../../util/roleUtils";

export default function RoleQuickNav({ user }) {
  const location = useLocation();

  if (!user) {
    return (
      <div className="mb-8 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
              🔐
            </div>

            <div>
              <p className="text-sm font-bold text-slate-800">
                Bạn chưa đăng nhập
              </p>

              <p className="text-xs text-slate-500">
                Đăng nhập để quản lý yêu cầu và theo dõi công trình.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              to="/login"
              className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition shadow-sm"
            >
              Đăng nhập
            </Link>

            <Link
              to="/register"
              className="px-4 py-2 bg-white text-blue-600 text-xs font-bold rounded-lg border border-blue-200 hover:bg-blue-50 transition"
            >
              Đăng ký
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isAdmin(user)) {
    return (
      <RoleBar
        title="Quản trị hệ thống"
        username={user.fullName || user.username}
        icon="⚙️"
        theme="dark"
        links={[
          {
            to: "/admin/dashboard",
            label: "Dashboard",
            icon: "📊",
          },
          {
            to: "/admin/employees",
            label: "Tài khoản",
            icon: "👥",
          },
          {
            to: "/admin/revenue",
            label: "Doanh thu",
            icon: "📈",
          },
          {
            to: "/admin/wallet",
            label: "Ví hệ thống",
            icon: "💰",
          },
        ]}
        currentPath={location.pathname}
      />
    );
  }

  if (isSurveyStaff(user)) {
    return (
      <RoleBar
        title="Khảo sát viên"
        username={user.fullName || user.username}
        icon="📋"
        theme="blue"
        links={[
          {
            to: "/staff/survey/dashboard",
            label: "Tổng quan",
            icon: "📊",
          },
          {
            to: "/staff/survey/jobs",
            label: "Lịch yêu cầu",
            icon: "📅",
          },
          {
            to: "/staff/survey/history",
            label: "Lịch sử",
            icon: "🕘",
          },
          {
            to: "/staff/survey/wallet",
            label: "Ví thu nhập",
            icon: "💰",
          },
          {
            to: "/staff/survey/profile",
            label: "Tài khoản",
            icon: "👤",
          },
        ]}
        currentPath={location.pathname}
      />
    );
  }

  if (isTechnicianStaff(user)) {
    return (
      <RoleBar
        title="Kỹ thuật viên thi công"
        username={user.fullName || user.username}
        icon="🔧"
        theme="amber"
        links={[
          {
            to: "/staff/technician/dashboard",
            label: "Tổng quan",
            icon: "📊",
          },
          {
            to: "/staff/technician/jobs",
            label: "Công việc",
            icon: "🔨",
          },
          {
            to: "/staff/technician/history",
            label: "Lịch sử",
            icon: "🕘",
          },
          {
            to: "/staff/technician/wallet",
            label: "Ví & hoa hồng",
            icon: "💰",
          },
          {
            to: "/staff/technician/profile",
            label: "Tài khoản",
            icon: "👤",
          },
        ]}
        currentPath={location.pathname}
      />
    );
  }

  if (isCustomer(user)) {
    return (
      <RoleBar
        title="Khách hàng"
        username={user.fullName || user.username}
        icon="🏠"
        theme="emerald"
        links={[
          {
            to: "/home#booking",
            label: "Tạo yêu cầu",
            icon: "➕",
          },
          {
            to: "/customer/history",
            label: "Lịch sử",
            icon: "📋",
          },
          {
            to: "/customer/wallet",
            label: "Ví thanh toán",
            icon: "💳",
          },
          {
            to: "/customer/profile",
            label: "Tài khoản",
            icon: "👤",
          },
        ]}
        currentPath={location.pathname}
      />
    );
  }

  return (
    <div className="mb-8 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <Link
        to={getRedirectPath(user)}
        className="text-sm font-bold text-blue-600 hover:text-blue-700"
      >
        Vào trang quản lý →
      </Link>
    </div>
  );
}

/* =========================
   ROLE BAR
========================= */

function RoleBar({
  title,
  username,
  icon,
  theme,
  links,
  currentPath,
}) {
  const themeConfig = {
    dark: {
      wrapper:
        "bg-slate-900 border-slate-800 text-white",
      icon:
        "bg-white/10 text-white border-white/10",
      subtitle:
        "text-slate-400",
      link:
        "text-slate-300 hover:bg-white/10 hover:text-white",
      active:
        "bg-white text-slate-900 shadow-sm",
    },

    blue: {
      wrapper:
        "bg-blue-50 border-blue-100 text-slate-900",
      icon:
        "bg-blue-600 text-white border-blue-500",
      subtitle:
        "text-blue-600",
      link:
        "text-slate-600 hover:bg-white hover:text-blue-600",
      active:
        "bg-blue-600 text-white shadow-sm",
    },

    amber: {
      wrapper:
        "bg-amber-50 border-amber-100 text-slate-900",
      icon:
        "bg-amber-500 text-white border-amber-400",
      subtitle:
        "text-amber-700",
      link:
        "text-slate-600 hover:bg-white hover:text-amber-700",
      active:
        "bg-amber-500 text-white shadow-sm",
    },

    emerald: {
      wrapper:
        "bg-emerald-50 border-emerald-100 text-slate-900",
      icon:
        "bg-emerald-600 text-white border-emerald-500",
      subtitle:
        "text-emerald-700",
      link:
        "text-slate-600 hover:bg-white hover:text-emerald-700",
      active:
        "bg-emerald-600 text-white shadow-sm",
    },
  };

  const config = themeConfig[theme] || themeConfig.blue;

  return (
    <div
      className={`mb-8 rounded-2xl border px-4 py-3 shadow-sm ${config.wrapper}`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

        {/* USER ROLE */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            className={`w-10 h-10 rounded-xl border flex items-center justify-center text-lg ${config.icon}`}
          >
            {icon}
          </div>

          <div className="leading-tight">
            <p className="text-sm font-black">
              {username}
            </p>

            <p className={`text-[10px] font-bold uppercase tracking-wider ${config.subtitle}`}>
              {title}
            </p>
          </div>
        </div>

        {/* NAV */}
        <nav className="flex flex-wrap gap-1.5">
          {links.map((link) => {
            const active =
              currentPath === link.to ||
              currentPath.startsWith(link.to + "/");

            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition ${active ? config.active : config.link
                  }`}
              >
                <span className="text-sm">
                  {link.icon}
                </span>

                <span>
                  {link.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}