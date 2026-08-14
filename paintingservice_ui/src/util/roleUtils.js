export function getStaffType(user) {
  const raw =
    user?.staffType ||
    user?.staffProfile?.staffType ||
    user?.user?.staffType ||
    user?.user?.staffProfile?.staffType;
  return (typeof raw === "object" ? raw?.name : raw)?.toUpperCase();
}

export function getRoleName(user) {
  const raw = user?.role;
  return (typeof raw === "object" ? raw?.name : raw)?.toUpperCase();
}

export function isAdmin(user) {
  const role = getRoleName(user);
  return role === "ROLE_ADMIN" || role === "ADMIN";
}

export function isStaff(user) {
  const role = getRoleName(user);
  return role === "ROLE_STAFF" || role === "STAFF" || role === "NHANVIEN";
}

export function isSurveyStaff(user) {
  if (!isStaff(user)) return false;
  const staffType = getStaffType(user);
  return staffType !== "WORKER" && staffType !== "TECHNICIAN";
}

export function isTechnicianStaff(user) {
  if (!isStaff(user)) return false;
  const staffType = getStaffType(user);
  return staffType === "WORKER" || staffType === "TECHNICIAN";
}

export function isCustomer(user) {
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
