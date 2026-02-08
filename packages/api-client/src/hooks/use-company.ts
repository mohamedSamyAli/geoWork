// ---------------------------------------------------------------------------
// Company hooks — onboarding, list, detail, update
// ---------------------------------------------------------------------------

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateCompanyPayload } from "@repo/types";
import { companyService } from "../services/company";
import { queryKeys } from "../lib/query-keys";

/**
 * Onboarding mutation: creates a company and inserts the current user as owner.
 * Call this after signup when the user submits their company name.
 */
export function useOnboardingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCompanyPayload) => companyService.onboard(payload),
    onSuccess: (result) => {
      if (result.data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
      }
    },
  });
}

/** Fetch all companies the current user belongs to (with membership info). */
export function useMyCompanies(enabled = true) {
  return useQuery({
    queryKey: queryKeys.companies.all,
    queryFn: () => companyService.getMyCompanies(),
    enabled,
  });
}

/** Fetch a single company by ID. */
export function useCompanyQuery(companyId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.companies.detail(companyId!),
    queryFn: () => companyService.getCompanyById(companyId!),
    enabled: !!companyId,
  });
}

/** Update a company (must be owner). */
export function useUpdateCompanyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      companyId,
      payload,
    }: {
      companyId: string;
      payload: CreateCompanyPayload;
    }) => companyService.updateCompany(companyId, payload),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.companies.detail(variables.companyId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
    },
  });
}
