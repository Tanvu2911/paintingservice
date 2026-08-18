export function getStaffType(user) {
  let raw =
    user?.staffType ||
    user?.staffProfile?.staffType ||
    user?.user?.staffType ||
    user?.user?.staffProfile?.staffType;

  if (!raw) {
    try {
      const saved = localStorage.getItem("user");
      if (saved) {
        const parsed = JSON.parse(saved);
        raw =
          parsed?.staffType ||
          parsed?.staffProfile?.staffType ||
          parsed?.user?.staffType;
      }
    } catch (e) {}
  }
  return (typeof raw === "object" ? raw?.name : raw)?.toUpperCase();
}

export function getRoleName(user) {
  let raw = user?.role || user?.roleName;
  if (!raw && user?.roleId) {
    if (user.roleId === 1) return "ROLE_ADMIN";
    if (user.roleId === 3) return "ROLE_STAFF";
    if (user.roleId === 2) return "ROLE_USER";
  }
  if (!raw) {
    try {
      const saved = localStorage.getItem("user");
      if (saved) {
        const parsed = JSON.parse(saved);
        raw = parsed?.role || parsed?.roleName;
        if (!raw && parsed?.roleId) {
          if (parsed.roleId === 1) return "ROLE_ADMIN";
          if (parsed.roleId === 3) return "ROLE_STAFF";
          if (parsed.roleId === 2) return "ROLE_USER";
        }
      }
    } catch (e) {}
  }
  return (typeof raw === "object" ? raw?.name : raw)?.toUpperCase();
}

export function isAdmin(user) {
  const role = getRoleName(user);
  if (role === "ROLE_ADMIN" || role === "ADMIN") return true;
  if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) return true;
  return false;
}

export function isStaff(user) {
  const role = getRoleName(user);
  if (role === "ROLE_STAFF" || role === "STAFF" || role === "NHANVIEN") return true;
  if (typeof window !== "undefined" && window.location.pathname.startsWith("/staff")) return true;
  return false;
}

export function isSurveyStaff(user) {
  if (typeof window !== "undefined" && window.location.pathname.startsWith("/staff/survey")) return true;
  if (!isStaff(user)) return false;
  const staffType = getStaffType(user);
  return staffType !== "WORKER" && staffType !== "TECHNICIAN";
}

export function isTechnicianStaff(user) {
  if (typeof window !== "undefined" && window.location.pathname.startsWith("/staff/technician")) return true;
  if (!isStaff(user)) return false;
  const staffType = getStaffType(user);
  return staffType === "WORKER" || staffType === "TECHNICIAN";
}

export function isCustomer(user) {
  if (typeof window !== "undefined" && window.location.pathname.startsWith("/customer")) return true;
  if (!user) return false;
  return !isAdmin(user) && !isStaff(user);
}

export function getRedirectPath(user) {
  if (!user) return "/login";
  if (isAdmin(user)) return "/admin/dashboard";
  if (isTechnicianStaff(user)) return "/staff/technician/dashboard";
  if (isSurveyStaff(user)) return "/staff/survey/dashboard";
  return "/customer/dashboard";
}
