export type BusinessRole = "DEPARTMENT_HEAD" | "DOCTOR" | "TECHNICIAN";

export interface ProfileAccess {
  active: boolean;
  business_role: BusinessRole;
  is_admin: boolean;
}

export function roleLabel(role: BusinessRole): string {
  return {
    DEPARTMENT_HEAD: "Trưởng khoa",
    DOCTOR: "Bác sĩ phụ trách",
    TECHNICIAN: "Kỹ thuật viên",
  }[role];
}

export type RouteAccessLevel = "public" | "authenticated" | "admin";

export function routeAccessLevel(pathname: string): RouteAccessLevel {
  if (pathname === "/login" || pathname === "/offline" || pathname.startsWith("/auth/")) {
    return "public";
  }
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return "admin";
  }
  return "authenticated";
}

export function userAccessState(profile: ProfileAccess | null) {
  const active = profile?.active === true;
  return {
    authenticated: profile !== null,
    active,
    canAdminister: active && profile.is_admin,
    canApprove: active && profile.business_role === "DEPARTMENT_HEAD",
  };
}
