// ---------------------------------------------------------------------------
// useSession — reactive auth session via onAuthStateChange
// ---------------------------------------------------------------------------

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authService } from "../services/auth";
import { queryKeys } from "../lib/query-keys";

/**
 * Returns the current Supabase session.
 * Automatically refreshes when auth state changes (login, logout, token refresh).
 */
export function useSession() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.auth.session,
    queryFn: () => authService.getSession(),
    staleTime: Infinity, // refreshed by the listener, not by polling
    retry: false,
  });

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange(() => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.session });
    });
    return unsubscribe;
  }, [queryClient]);

  // Unwrap the Result for convenience
  const session = query.data?.data ?? null;
  const user = session?.user ?? null;

  return {
    ...query,
    session,
    user,
    isAuthenticated: !!user,
  };
}
