// ---------------------------------------------------------------------------
// Worker hooks — list, detail, CRUD mutations, skills, master data
// ---------------------------------------------------------------------------

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  CreateWorkerPayload,
  UpdateWorkerPayload,
  AddWorkerEquipmentSkillPayload,
  CreateSoftwarePayload,
  CreateEquipmentBrandPayload,
} from "@repo/types";
import { workerService } from "../services/worker";
import { queryKeys } from "../lib/query-keys";

// ---- Worker CRUD Hooks ----------------------------------------------------

export function useWorkerList(
  companyId: string | undefined,
  filters?: {
    status?: "active" | "inactive";
    category?: "engineer" | "surveyor" | "assistant";
    search?: string;
  }
) {
  return useQuery({
    queryKey: [...queryKeys.workers.all(companyId!), filters],
    queryFn: () => workerService.list(companyId!, filters),
    enabled: !!companyId,
  });
}

export function useWorkerDetail(workerId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.workers.detail(workerId!),
    queryFn: () => workerService.getById(workerId!),
    enabled: !!workerId,
  });
}

export function useCreateWorkerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ companyId, payload }: { companyId: string; payload: CreateWorkerPayload }) =>
      workerService.create(companyId, payload),
    onSuccess: (result, { companyId }) => {
      if (result.data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.workers.all(companyId) });
      }
    },
  });
}

export function useUpdateWorkerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workerId, payload }: { workerId: string; payload: UpdateWorkerPayload }) =>
      workerService.update(workerId, payload),
    onSuccess: (result, { workerId }) => {
      if (result.data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.workers.detail(workerId) });
        queryClient.invalidateQueries({ queryKey: ["workers"] });
      }
    },
  });
}

export function useArchiveWorkerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (workerId: string) => workerService.archive(workerId),
    onSuccess: (result, workerId) => {
      if (result.data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.workers.detail(workerId) });
        queryClient.invalidateQueries({ queryKey: ["workers"] });
      }
    },
  });
}

export function useReactivateWorkerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (workerId: string) => workerService.reactivate(workerId),
    onSuccess: (result, workerId) => {
      if (result.data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.workers.detail(workerId) });
        queryClient.invalidateQueries({ queryKey: ["workers"] });
      }
    },
  });
}

// ---- Equipment Skills Hooks ------------------------------------------------

export function useWorkerEquipmentSkills(workerId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.workers.equipmentSkills(workerId!),
    queryFn: () => workerService.getEquipmentSkills(workerId!),
    enabled: !!workerId,
  });
}

export function useAddWorkerEquipmentSkillMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      workerId,
      payload,
    }: {
      workerId: string;
      payload: AddWorkerEquipmentSkillPayload;
    }) => workerService.addEquipmentSkill(workerId, payload),
    onSuccess: (result, { workerId }) => {
      if (result.data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.workers.equipmentSkills(workerId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.workers.detail(workerId) });
      }
    },
  });
}

export function useUpdateWorkerEquipmentSkillMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      skillId,
      workerId,
      rating,
    }: {
      skillId: string;
      workerId: string;
      rating: number;
    }) => workerService.updateEquipmentSkill(skillId, rating as 1 | 2 | 3 | 4 | 5),
    onSuccess: (result, { workerId }) => {
      if (result.data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.workers.equipmentSkills(workerId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.workers.detail(workerId) });
      }
    },
  });
}

export function useRemoveWorkerEquipmentSkillMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      skillId,
      workerId,
    }: {
      skillId: string;
      workerId: string;
    }) => workerService.removeEquipmentSkill(skillId),
    onSuccess: (_result, { workerId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workers.equipmentSkills(workerId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.workers.detail(workerId) });
    },
  });
}

// ---- Software Skills Hooks -------------------------------------------------

export function useWorkerSoftwareSkills(workerId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.workers.softwareSkills(workerId!),
    queryFn: () => workerService.getSoftwareSkills(workerId!),
    enabled: !!workerId,
  });
}

export function useAddWorkerSoftwareSkillMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workerId, softwareId }: { workerId: string; softwareId: string }) =>
      workerService.addSoftwareSkill(workerId, softwareId),
    onSuccess: (result, { workerId }) => {
      if (result.data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.workers.softwareSkills(workerId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.workers.detail(workerId) });
      }
    },
  });
}

export function useRemoveWorkerSoftwareSkillMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ skillId, workerId }: { skillId: string; workerId: string }) =>
      workerService.removeSoftwareSkill(skillId),
    onSuccess: (_result, { workerId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workers.softwareSkills(workerId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.workers.detail(workerId) });
    },
  });
}

// ---- Master Data Hooks -----------------------------------------------------

export function useSoftwareList(companyId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.workers.software(companyId!),
    queryFn: () => workerService.getSoftwareList(companyId!),
    enabled: !!companyId,
  });
}

export function useCreateSoftwareMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ companyId, payload }: { companyId: string; payload: CreateSoftwarePayload }) =>
      workerService.createSoftware(companyId, payload),
    onSuccess: (result, { companyId }) => {
      if (result.data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.workers.software(companyId) });
      }
    },
  });
}

export function useEquipmentBrands(companyId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.workers.equipmentBrands(companyId!),
    queryFn: () => workerService.getEquipmentBrands(companyId!),
    enabled: !!companyId,
  });
}

export function useCreateEquipmentBrandMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      companyId,
      payload,
    }: {
      companyId: string;
      payload: CreateEquipmentBrandPayload;
    }) => workerService.createEquipmentBrand(companyId, payload),
    onSuccess: (result, { companyId }) => {
      if (result.data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.workers.equipmentBrands(companyId) });
      }
    },
  });
}

export function useEquipmentTypesList(companyId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.workers.equipmentTypes(companyId!),
    queryFn: () => workerService.getEquipmentTypes(companyId!),
    enabled: !!companyId,
  });
}
