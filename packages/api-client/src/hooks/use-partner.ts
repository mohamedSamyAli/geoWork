// ---------------------------------------------------------------------------
// Partner hooks — list, detail, CRUD mutations
// ---------------------------------------------------------------------------

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreatePartnerPayload, UpdatePartnerPayload } from "@repo/types";
import { partnerService } from "../services/partner";
import { queryKeys } from "../lib/query-keys";

export function usePartnerList(
  companyId: string | undefined,
  filters?: { search?: string }
) {
  return useQuery({
    queryKey: [...queryKeys.partners.all(companyId!), filters],
    queryFn: () => partnerService.list(companyId!, filters),
    enabled: !!companyId,
  });
}

export function usePartnerDetail(partnerId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.partners.detail(partnerId!),
    queryFn: () => partnerService.getById(partnerId!),
    enabled: !!partnerId,
  });
}

export function useCreatePartnerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ companyId, payload }: { companyId: string; payload: CreatePartnerPayload }) =>
      partnerService.create(companyId, payload),
    onSuccess: (result, { companyId }) => {
      if (result.data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.partners.all(companyId) });
      }
    },
  });
}

export function useUpdatePartnerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ partnerId, payload }: { partnerId: string; payload: UpdatePartnerPayload }) =>
      partnerService.update(partnerId, payload),
    onSuccess: (result, { partnerId }) => {
      if (result.data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.partners.detail(partnerId) });
        queryClient.invalidateQueries({ queryKey: ["partners"] });
      }
    },
  });
}

export function useDeletePartnerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (partnerId: string) => partnerService.delete(partnerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partners"] });
    },
  });
}
