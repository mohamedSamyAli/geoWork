// ---------------------------------------------------------------------------
// Supplier hooks — list, detail, CRUD mutations
// ---------------------------------------------------------------------------

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateSupplierPayload, UpdateSupplierPayload } from "@repo/types";
import { supplierService } from "../services/supplier";
import { queryKeys } from "../lib/query-keys";

export function useSupplierList(
  companyId: string | undefined,
  filters?: { search?: string }
) {
  return useQuery({
    queryKey: [...queryKeys.suppliers.all(companyId!), filters],
    queryFn: () => supplierService.list(companyId!, filters),
    enabled: !!companyId,
  });
}

export function useSupplierDetail(supplierId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.suppliers.detail(supplierId!),
    queryFn: () => supplierService.getById(supplierId!),
    enabled: !!supplierId,
  });
}

export function useCreateSupplierMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ companyId, payload }: { companyId: string; payload: CreateSupplierPayload }) =>
      supplierService.create(companyId, payload),
    onSuccess: (result, { companyId }) => {
      if (result.data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.all(companyId) });
      }
    },
  });
}

export function useUpdateSupplierMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ supplierId, payload }: { supplierId: string; payload: UpdateSupplierPayload }) =>
      supplierService.update(supplierId, payload),
    onSuccess: (result, { supplierId }) => {
      if (result.data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.detail(supplierId) });
        queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      }
    },
  });
}

export function useDeleteSupplierMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (supplierId: string) => supplierService.delete(supplierId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });
}
