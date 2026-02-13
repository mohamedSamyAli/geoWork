// ---------------------------------------------------------------------------
// Customer hooks — list, detail, CRUD mutations, contacts, sites
// ---------------------------------------------------------------------------

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  CreateCustomerPayload,
  UpdateCustomerPayload,
  CreateCustomerContactPayload,
  UpdateCustomerContactPayload,
  CreateCustomerSitePayload,
  UpdateCustomerSitePayload,
} from "@repo/types";
import { customerService } from "../services/customer";
import { queryKeys } from "../lib/query-keys";

// ---- Customer CRUD Hooks ---------------------------------------------------

export function useCustomerList(
  companyId: string | undefined,
  filters?: {
    status?: "active" | "inactive" | "prospect";
    customer_type?: "individual" | "company" | "government";
    search?: string;
  }
) {
  return useQuery({
    queryKey: [...queryKeys.customers.all(companyId!), filters],
    queryFn: () => customerService.list(companyId!, filters),
    enabled: !!companyId,
  });
}

export function useCustomerDetail(customerId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.customers.detail(customerId!),
    queryFn: () => customerService.getById(customerId!),
    enabled: !!customerId,
  });
}

export function useCreateCustomerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ companyId, payload }: { companyId: string; payload: CreateCustomerPayload }) =>
      customerService.create(companyId, payload),
    onSuccess: (result, { companyId }) => {
      if (result.data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.customers.all(companyId) });
      }
    },
  });
}

export function useUpdateCustomerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      customerId,
      payload,
    }: {
      customerId: string;
      payload: UpdateCustomerPayload;
    }) => customerService.update(customerId, payload),
    onSuccess: (result, { customerId }) => {
      if (result.data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.customers.detail(customerId) });
        queryClient.invalidateQueries({ queryKey: ["customers"] });
      }
    },
  });
}

export function useSoftDeleteCustomerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ customerId }: { customerId: string; companyId: string }) =>
      customerService.softDelete(customerId),
    onSuccess: (result, { companyId }) => {
      if (result.data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.customers.all(companyId) });
      }
    },
  });
}

// ---- Contact Hooks ---------------------------------------------------------

export function useCustomerContacts(customerId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.customers.contacts(customerId!),
    queryFn: () => customerService.getContacts(customerId!),
    enabled: !!customerId,
  });
}

export function useCreateCustomerContactMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      customerId,
      payload,
    }: {
      customerId: string;
      payload: CreateCustomerContactPayload;
    }) => customerService.createContact(customerId, payload),
    onSuccess: (result, { customerId }) => {
      if (result.data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.customers.contacts(customerId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.customers.detail(customerId) });
      }
    },
  });
}

export function useUpdateCustomerContactMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      contactId,
      customerId,
      payload,
    }: {
      contactId: string;
      customerId: string;
      payload: UpdateCustomerContactPayload;
    }) => customerService.updateContact(contactId, payload),
    onSuccess: (result, { customerId }) => {
      if (result.data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.customers.contacts(customerId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.customers.detail(customerId) });
      }
    },
  });
}

export function useDeleteCustomerContactMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ contactId }: { contactId: string; customerId: string }) =>
      customerService.deleteContact(contactId),
    onSuccess: (_result, { customerId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.contacts(customerId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.detail(customerId) });
    },
  });
}

// ---- Site Hooks ------------------------------------------------------------

export function useCustomerSites(customerId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.customers.sites(customerId!),
    queryFn: () => customerService.getSites(customerId!),
    enabled: !!customerId,
  });
}

export function useCreateCustomerSiteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      customerId,
      payload,
    }: {
      customerId: string;
      payload: CreateCustomerSitePayload;
    }) => customerService.createSite(customerId, payload),
    onSuccess: (result, { customerId }) => {
      if (result.data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.customers.sites(customerId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.customers.detail(customerId) });
      }
    },
  });
}

export function useUpdateCustomerSiteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      siteId,
      customerId,
      payload,
    }: {
      siteId: string;
      customerId: string;
      payload: UpdateCustomerSitePayload;
    }) => customerService.updateSite(siteId, payload),
    onSuccess: (result, { customerId }) => {
      if (result.data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.customers.sites(customerId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.customers.detail(customerId) });
      }
    },
  });
}

export function useSoftDeleteCustomerSiteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ siteId }: { siteId: string; customerId: string }) =>
      customerService.softDeleteSite(siteId),
    onSuccess: (result, { customerId }) => {
      if (result.data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.customers.sites(customerId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.customers.detail(customerId) });
      }
    },
  });
}
