import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { UserRole } from "@/types/roles";

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { isLoaded, isSignedIn, user } = useUser();
  const location = useLocation();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isSignedIn || !user) {
    // Redirect to login but save the attempted location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const role = (user.publicMetadata?.role as UserRole | undefined) ?? "candidate";
    const allowlistRaw = (import.meta as any).env?.VITE_ADMIN_EMAIL_ALLOWLIST as string | undefined;
    const allowlistedEmails = (allowlistRaw ?? "")
      .split(",")
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean);
    const primaryEmail = user.primaryEmailAddress?.emailAddress?.toLowerCase() ?? "";
    const isAllowlistedAdmin = allowlistedEmails.includes(primaryEmail);
    const effectiveRole: UserRole = isAllowlistedAdmin ? "admin" : role;

    if (!allowedRoles.includes(effectiveRole)) {
      return <Navigate to={effectiveRole === "admin" ? "/admin" : "/dashboard"} replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
