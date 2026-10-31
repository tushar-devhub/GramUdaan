import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import type { UserRole } from "@/types/auth";
import { ShieldAlert, ArrowRight, Loader2 } from "lucide-react";
import { Link } from "react-router";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { isLoading, isAuthenticated, user, roleDashboardUrl } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 rounded-full border-2 border-emerald-200 border-t-emerald-700 animate-spin" />
          <span className="text-xs text-muted-foreground font-medium">Verifying authorization...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={`/signin?returnTo=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  }

  // If role restriction is specified and user role does not match
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 mb-4">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Restricted Access</h2>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            Your account role is registered as <strong className="capitalize text-slate-900">{user.role}</strong>. This dashboard is reserved for <strong className="capitalize">{allowedRoles.join(" / ")}</strong> users.
          </p>
          <Link
            to={roleDashboardUrl}
            className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-emerald-800 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-900 transition-colors shadow-sm"
          >
            Go to My Dashboard <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/** Automatically routes /dashboard visits to role-specific dashboard */
export function DashboardRoleRedirect() {
  const { isLoading, isAuthenticated, roleDashboardUrl } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 rounded-full border-2 border-emerald-200 border-t-emerald-700 animate-spin" />
          <span className="text-xs text-muted-foreground font-medium">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={`/signin?returnTo=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  return <Navigate to={roleDashboardUrl} replace />;
}
