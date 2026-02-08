// ---------------------------------------------------------------------------
// Profile hooks — read & update the current user's profile
// ---------------------------------------------------------------------------

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UpdateProfilePayload } from "@repo/types";
import { profileService } from "../services/profile";
import { queryKeys } from "../lib/query-keys";

/** Fetch the authenticated user's profile. Only enabled when authenticated. */
export function useMyProfile(enabled = true) {
  return useQuery({
    queryKey: queryKeys.profile.me,
    queryFn: () => profileService.getMyProfile(),
    enabled,
  });
}

/** Update the authenticated user's profile. Invalidates profile cache on success. */
export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) =>
      profileService.updateMyProfile(payload),
    onSuccess: (result) => {
      if (result.data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.profile.me });
      }
    },
  });
}
