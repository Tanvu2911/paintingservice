// import { Link, useLocation } from "react-router-dom";
// import {
//   isAdmin,
//   isSurveyStaff,
//   isTechnicianStaff,
//   isCustomer,
//   getRedirectPath,
// } from "../../util/roleUtils";

// export default function RoleQuickNav({ user }) {
//   const location = useLocation();

//   if (!user) {
//     return (
//       <div className="mb-8 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-4">
//         <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
//           <div className="flex items-center gap-3">
//             <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
//               🔐
//             </div>

//             <div>
//               <p className="text-sm font-bold text-slate-800">
//                 Bạn chưa đăng nhập
//               </p>

//               <p className="text-xs text-slate-500">
//                 Đăng nhập để quản lý yêu cầu và theo dõi công trình.
//               </p>
//             </div>
//           </div>

//           <div className="flex gap-2">
//             <Link
//               to="/login"
//               className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition shadow-sm"
//             >
//               Đăng nhập
//             </Link>

//             <Link
//               to="/register"
//               className="px-4 py-2 bg-white text-blue-600 text-xs font-bold rounded-lg border border-blue-200 hover:bg-blue-50 transition"
//             >
//               Đăng ký
//             </Link>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (isAdmin(user)) {
//     return (
//       <RoleBar
//         title="Quản trị hệ thống"
//         username={user.fullName || user.username}
//         icon="⚙️"
//         theme="dark"
//         links={[
//           {
//             to: "/admin/dashboard",
//             label: "Dashboard",
//             icon: "📊",
//           },
//           {
//             to: "/admin/employees",
//             label: "Tài khoản",
//             icon: "👥",
//           },
//           {
//             to: "/admin/revenue",
//             label: "Doanh thu",
//             icon: "📈",
//           },
//           {
//             to: "/admin/wallet",
//             label: "Ví hệ thống",
//             icon: "💰",
//           },
//         ]}
//         currentPath={location.pathname}
//       />
//     );
//   }

//   if (isSurveyStaff(user)) {
//     return (
//       <RoleBar
//         title="Khảo sát viên"
//         username={user.fullName || user.username}
//         icon="📋"
//         theme="blue"
//         links={[
//           {
//             to: "/staff/survey/dashboard",
//             label: "Tổng quan",
//             icon: "📊",
//           },
//           {
//             to: "/staff/survey/jobs",
//             label: "Lịch yêu cầu",
//             icon: "📅",
//           },
//           {
//             to: "/staff/survey/history",
//             label: "Lịch sử",
//             icon: "🕘",
//           },
//           {
//             to: "/staff/survey/wallet",
//             label: "Ví thu nhập",
//             icon: "💰",
//           },
//           {
//             to: "/staff/survey/profile",
//             label: "Tài khoản",
//             icon: "👤",
//           },
//         ]}
//         currentPath={location.pathname}
//       />
//     );
//   }

//   if (isTechnicianStaff(user)) {
//     return (
//       <RoleBar
//         title="Kỹ thuật viên thi công"
//         username={user.fullName || user.username}
//         icon="🔧"
//         theme="amber"
//         links={[
//           {
//             to: "/staff/technician/dashboard",
//             label: "Tổng quan",
//             icon: "📊",
//           },
//           {
//             to: "/staff/technician/jobs",
//             label: "Công việc",
//             icon: "🔨",
//           },
//           {
//             to: "/staff/technician/history",
//             label: "Lịch sử",
//             icon: "🕘",
//           },
//           {
//             to: "/staff/technician/wallet",
//             label: "Ví & hoa hồng",
//             icon: "💰",
//           },
//           {
//             to: "/staff/technician/profile",
//             label: "Tài khoản",
//             icon: "👤",
//           },
//         ]}
//         currentPath={location.pathname}
//       />
//     );
//   }

//   if (isCustomer(user)) {
//     return (
//       <RoleBar
//         title="Khách hàng"
//         username={user.fullName || user.username}
//         icon="🏠"
//         theme="emerald"
//         links={[
//           {
//             to: "/home#booking",
//             label: "Tạo yêu cầu",
//             icon: "➕",
//           },
//           {
//             to: "/customer/history",
//             label: "Lịch sử",
//             icon: "📋",
//           },
//           {
//             to: "/customer/wallet",
//             label: "Ví thanh toán",
//             icon: "💳",
//           },
//           {
//             to: "/customer/profile",
//             label: "Tài khoản",
//             icon: "👤",
//           },
//         ]}
//         currentPath={location.pathname}
//       />
//     );
//   }

//   return (
//     <div className="mb-8 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
//       <Link
//         to={getRedirectPath(user)}
//         className="text-sm font-bold text-blue-600 hover:text-blue-700"
//       >
//         Vào trang quản lý →
//       </Link>
//     </div>
//   );
// }

// /* =========================
//    ROLE BAR
// ========================= */

// function RoleBar({
//   title,
//   username,
//   icon,
//   theme,
//   links,
//   currentPath,
// }) {
//   const themeConfig = {
//     dark: {
//       wrapper:
//         "bg-slate-900 border-slate-800 text-white",
//       icon:
//         "bg-white/10 text-white border-white/10",
//       subtitle:
//         "text-slate-400",
//       link:
//         "text-slate-300 hover:bg-white/10 hover:text-white",
//       active:
//         "bg-white text-slate-900 shadow-sm",
//     },

//     blue: {
//       wrapper:
//         "bg-blue-50 border-blue-100 text-slate-900",
//       icon:
//         "bg-blue-600 text-white border-blue-500",
//       subtitle:
//         "text-blue-600",
//       link:
//         "text-slate-600 hover:bg-white hover:text-blue-600",
//       active:
//         "bg-blue-600 text-white shadow-sm",
//     },

//     amber: {
//       wrapper:
//         "bg-amber-50 border-amber-100 text-slate-900",
//       icon:
//         "bg-amber-500 text-white border-amber-400",
//       subtitle:
//         "text-amber-700",
//       link:
//         "text-slate-600 hover:bg-white hover:text-amber-700",
//       active:
//         "bg-amber-500 text-white shadow-sm",
//     },

//     emerald: {
//       wrapper:
//         "bg-emerald-50 border-emerald-100 text-slate-900",
//       icon:
//         "bg-emerald-600 text-white border-emerald-500",
//       subtitle:
//         "text-emerald-700",
//       link:
//         "text-slate-600 hover:bg-white hover:text-emerald-700",
//       active:
//         "bg-emerald-600 text-white shadow-sm",
//     },
//   };

//   const config = themeConfig[theme] || themeConfig.blue;

//   return (
//     <div
//       className={`mb-8 rounded-2xl border px-4 py-3 shadow-sm ${config.wrapper}`}
//     >
//       <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

//         {/* USER ROLE */}
//         <div className="flex items-center gap-3 shrink-0">
//           <div
//             className={`w-10 h-10 rounded-xl border flex items-center justify-center text-lg ${config.icon}`}
//           >
//             {icon}
//           </div>

//           <div className="leading-tight">
//             <p className="text-sm font-black">
//               {username}
//             </p>

//             <p className={`text-[10px] font-bold uppercase tracking-wider ${config.subtitle}`}>
//               {title}
//             </p>
//           </div>
//         </div>

//         {/* NAV */}
//         <nav className="flex flex-wrap gap-1.5">
//           {links.map((link) => {
//             const active =
//               currentPath === link.to ||
//               currentPath.startsWith(link.to + "/");

//             return (
//               <Link
//                 key={link.to}
//                 to={link.to}
//                 className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition ${active ? config.active : config.link
//                   }`}
//               >
//                 <span className="text-sm">
//                   {link.icon}
//                 </span>

//                 <span>
//                   {link.label}
//                 </span>
//               </Link>
//             );
//           })}
//         </nav>
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

/**
 * RoleQuickNav
 * - compact=true  → dùng trên Home (gọn, chỉ hiện khi đã login)
 * - compact=false → dùng trên trang quản lý (full)
 */
export default function RoleQuickNav({ user, compact = false }) {
  const location = useLocation();

  // Trên Home: chưa login thì không hiện gì
  if (!user) {
    if (compact) return null;

    return (
      <div className="py-3">
        <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-4">
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
      </div>
    );
  }

  // ─── ADMIN / STAFF trên Home: chỉ hiện 1 nút ───────────────────────────
  if (compact && (isAdmin(user) || isSurveyStaff(user) || isTechnicianStaff(user))) {
    return (
      <div className="py-2">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base">
              {isAdmin(user) ? "⚙️" : isSurveyStaff(user) ? "📋" : "🔧"}
            </span>
            <span className="text-xs font-bold text-slate-700 truncate">
              {user.fullName || user.username}
            </span>
            <span className="text-[10px] font-semibold text-slate-400 uppercase">
              {isAdmin(user)
                ? "Admin"
                : isSurveyStaff(user)
                  ? "Khảo sát"
                  : "Kỹ thuật"}
            </span>
          </div>
          <Link
            to={getRedirectPath(user)}
            className="shrink-0 px-3.5 py-1.5 bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold rounded-lg transition"
          >
            Vào trang quản lý →
          </Link>
        </div>
      </div>
    );
  }

  // ─── CUSTOMER ──────────────────────────────────────────────────────────
  if (isCustomer(user)) {
    if (compact) return null;
    return null;
  }

  // ─── ADMIN full ────────────────────────────────────────────────────────
  if (isAdmin(user)) {
    return (
      <RoleBar
        title="Quản trị hệ thống"
        username={user.fullName || user.username}
        icon="⚙️"
        theme="dark"
        compact={compact}
        links={[
          { to: "/admin/dashboard", label: "Dashboard", icon: "📊" },
          { to: "/admin/employees", label: "Tài khoản", icon: "👥" },
          { to: "/admin/revenue", label: "Doanh thu", icon: "📈" },
          { to: "/admin/wallet", label: "Ví hệ thống", icon: "💰" },
        ]}
        currentPath={location.pathname}
      />
    );
  }

  // ─── SURVEY STAFF full ─────────────────────────────────────────────────
  if (isSurveyStaff(user)) {
    return (
      <RoleBar
        title="Khảo sát viên"
        username={user.fullName || user.username}
        icon="📋"
        theme="blue"
        compact={compact}
        links={[
          { to: "/staff/survey/dashboard", label: "Tổng quan", icon: "📊" },
          { to: "/staff/survey/jobs", label: "Lịch yêu cầu", icon: "📅" },
          { to: "/staff/survey/history", label: "Lịch sử", icon: "🕘" },
          { to: "/staff/survey/wallet", label: "Ví thu nhập", icon: "💰" },
          { to: "/staff/survey/profile", label: "Tài khoản", icon: "👤" },
        ]}
        currentPath={location.pathname}
      />
    );
  }

  // ─── TECHNICIAN full ───────────────────────────────────────────────────
  if (isTechnicianStaff(user)) {
    return (
      <RoleBar
        title="Kỹ thuật viên thi công"
        username={user.fullName || user.username}
        icon="🔧"
        theme="amber"
        compact={compact}
        links={[
          { to: "/staff/technician/dashboard", label: "Tổng quan", icon: "📊" },
          { to: "/staff/technician/jobs", label: "Công việc", icon: "🔨" },
          { to: "/staff/technician/history", label: "Lịch sử", icon: "🕘" },
          { to: "/staff/technician/wallet", label: "Ví & hoa hồng", icon: "💰" },
          { to: "/staff/technician/profile", label: "Tài khoản", icon: "👤" },
        ]}
        currentPath={location.pathname}
      />
    );
  }

  return (
    <div className="py-2">
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
function RoleBar({ title, username, icon, theme, links, currentPath, compact }) {
  const themeConfig = {
    dark: {
      wrapper: "bg-slate-900 border-slate-800 text-white",
      icon: "bg-white/10 text-white border-white/10",
      subtitle: "text-slate-400",
      link: "text-slate-300 hover:bg-white/10 hover:text-white",
      active: "bg-white text-slate-900 shadow-sm",
    },
    blue: {
      wrapper: "bg-blue-50 border-blue-100 text-slate-900",
      icon: "bg-blue-600 text-white border-blue-500",
      subtitle: "text-blue-600",
      link: "text-slate-600 hover:bg-white hover:text-blue-600",
      active: "bg-blue-600 text-white shadow-sm",
    },
    amber: {
      wrapper: "bg-amber-50 border-amber-100 text-slate-900",
      icon: "bg-amber-500 text-white border-amber-400",
      subtitle: "text-amber-700",
      link: "text-slate-600 hover:bg-white hover:text-amber-700",
      active: "bg-amber-500 text-white shadow-sm",
    },
    emerald: {
      wrapper: "bg-emerald-50 border-emerald-100 text-slate-900",
      icon: "bg-emerald-600 text-white border-emerald-500",
      subtitle: "text-emerald-700",
      link: "text-slate-600 hover:bg-white hover:text-emerald-700",
      active: "bg-emerald-600 text-white shadow-sm",
    },
  };

  const config = themeConfig[theme] || themeConfig.blue;

  // Compact mode (Home): chỉ hiện nav links, bỏ phần user lớn
  if (compact) {
    return (
      <div className="py-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="text-base">{icon}</span>
            <span className="font-bold text-slate-700 truncate max-w-[120px]">
              {username}
            </span>
          </div>
          <nav className="flex flex-wrap gap-1">
            {links.map((link) => {
              const active =
                currentPath === link.to ||
                currentPath.startsWith(link.to + "/");
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${active
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                    }`}
                >
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    );
  }

  // Full mode
  return (
    <div className="py-2.5">
      <div className={`rounded-2xl border px-4 py-3 shadow-sm ${config.wrapper}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <div
              className={`w-10 h-10 rounded-xl border flex items-center justify-center text-lg ${config.icon}`}
            >
              {icon}
            </div>
            <div className="leading-tight">
              <p className="text-sm font-black">{username}</p>
              <p
                className={`text-[10px] font-bold uppercase tracking-wider ${config.subtitle}`}
              >
                {title}
              </p>
            </div>
          </div>

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
                  <span className="text-sm">{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}