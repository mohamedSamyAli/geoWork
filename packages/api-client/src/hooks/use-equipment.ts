// ---------------------------------------------------------------------------
// Equipment hooks — list, detail, CRUD mutations, partner ownership, types
// ---------------------------------------------------------------------------

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  CreateEquipmentPayload,
  UpdateEquipmentPayload,
  AddEquipmentPartnerPayload,
  UpdateEquipmentPartnerPayload,
  CreateEquipmentTypePayload,
} from "@repo/types";
import { equipmentService } from "../services/equipment";
import { queryKeys } from "../lib/query-keys";

export function useEquipmentList(
  companyId: string | undefined,
  filters?: {
    status?: "active" | "inactive";
    ownership_type?: "owned" | "rented";
    equipment_type_id?: string;
    search?: string;
  }
) {
  return useQuery({
    queryKey: [...queryKeys.equipment.all(companyId!), filters],
    queryFn: () => equipmentService.list(companyId!, filters),
    enabled: !!companyId,
  });
}

export function useEquipmentDetail(equipmentId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.equipment.detail(equipmentId!),
    queryFn: () => equipmentService.getById(equipmentId!),
    enabled: !!equipmentId,
  });
}

export function useCreateEquipmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ companyId, payload }: { companyId: string; payload: CreateEquipmentPayload }) =>
      equipmentService.create(companyId, payload),
    onSuccess: (result, { companyId }) => {
      if (result.data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.equipment.all(companyId) });
      }
    },
  });
}

export function useUpdateEquipmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ equipmentId, payload }: { equipmentId: string; payload: UpdateEquipmentPayload }) =>
      equipmentService.update(equipmentId, payload),
    onSuccess: (result, { equipmentId }) => {
      if (result.data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.equipment.detail(equipmentId) });
        queryClient.invalidateQueries({ queryKey: ["equipment"] });
      }
    },
  });
}

export function useArchiveEquipmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (equipmentId: string) => equipmentService.archive(equipmentId),
    onSuccess: (result, equipmentId) => {
      if (result.data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.equipment.detail(equipmentId) });
        queryClient.invalidateQueries({ queryKey: ["equipment"] });
      }
    },
  });
}

export function useReactivateEquipmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (equipmentId: string) => equipmentService.reactivate(equipmentId),
    onSuccess: (result, equipmentId) => {
      if (result.data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.equipment.detail(equipmentId) });
        queryClient.invalidateQueries({ queryKey: ["equipment"] });
      }
    },
  });
}

// ---- Partner Ownership Hooks ------------------------------------------------

export function useEquipmentPartners(equipmentId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.equipment.partners(equipmentId!),
    queryFn: () => equipmentService.listPartners(equipmentId!),
    enabled: !!equipmentId,
  });
}

export function useAddEquipmentPartnerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ equipmentId, payload }: { equipmentId: string; payload: AddEquipmentPartnerPayload }) =>
      equipmentService.addPartner(equipmentId, payload),
    onSuccess: (result, { equipmentId }) => {
      if (result.data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.equipment.partners(equipmentId) });
      }
    },
  });
}

export function useUpdateEquipmentPartnerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      equipmentPartnerId,
      payload,
    }: {
      equipmentPartnerId: string;
      equipmentId: string;
      payload: UpdateEquipmentPartnerPayload;
    }) => equipmentService.updatePartnerPercentage(equipmentPartnerId, payload),
    onSuccess: (result, { equipmentId }) => {
      if (result.data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.equipment.partners(equipmentId) });
      }
    },
  });
}

export function useRemoveEquipmentPartnerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ equipmentPartnerId }: { equipmentPartnerId: string; equipmentId: string }) =>
      equipmentService.removePartner(equipmentPartnerId),
    onSuccess: (_result, { equipmentId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.equipment.partners(equipmentId) });
    },
  });
}

// ---- Equipment Types Hooks --------------------------------------------------

export function useEquipmentTypes(companyId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.equipment.types(companyId!),
    queryFn: () => equipmentService.listTypes(companyId!),
    enabled: !!companyId,
  });
}

export function useCreateEquipmentTypeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ companyId, payload }: { companyId: string; payload: CreateEquipmentTypePayload }) =>
      equipmentService.createType(companyId, payload),
    onSuccess: (result, { companyId }) => {
      if (result.data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.equipment.types(companyId) });
      }
    },
  });
}
