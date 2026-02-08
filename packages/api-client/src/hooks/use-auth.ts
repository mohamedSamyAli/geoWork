// ---------------------------------------------------------------------------
// Auth mutation hooks — signUp, signIn, signOut, resetPassword
// ---------------------------------------------------------------------------

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { SignUpPayload, SignInPayload } from "@repo/types";
import { authService } from "../services/auth";
import { queryKeys } from "../lib/query-keys";

/** Sign up a new user. On success, invalidates session cache. */
export function useSignUpMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SignUpPayload) => authService.signUp(payload),
    onSuccess: (result) => {
      if (result.data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.session });
      }
    },
  });
}

/** Sign in with email + password. On success, invalidates session + profile cache. */
export function useSignInMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SignInPayload) => authService.signIn(payload),
    onSuccess: (result) => {
      if (result.data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.session });
        queryClient.invalidateQueries({ queryKey: queryKeys.profile.me });
        queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
      }
    },
  });
}

/** Sign out the current user. Clears all cached data. */
export function useSignOutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.signOut(),
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

/** Send a password reset email. */
export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: (email: string) => authService.resetPassword(email),
  });
}
