import { Navigate, Outlet } from "react-router-dom";
import { useSession } from "@repo/api-client";
import { Loader2 } from "lucide-react";

/** Wraps routes that require authentication. Redirects to /login if unauthenticated. */
export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useSession();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

/** Wraps routes that should only be accessible to guests (login/register). Redirects to /home if authenticated. */
export function GuestRoute() {
  const { isAuthenticated, isLoading } = useSession();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}
