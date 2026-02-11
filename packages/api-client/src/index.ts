// ---------------------------------------------------------------------------
// @repo/api-client — public API
// ---------------------------------------------------------------------------

// Initialisation
export { initApi } from "./init";
export { getSupabase } from "./client";

// React Query
export { createQueryClient } from "./query-client";

// Query keys (for manual invalidation in apps)
export { queryKeys } from "./lib/query-keys";

// ---- Auth -----------------------------------------------------------------
export { authService } from "./services/auth";
export { useSession } from "./hooks/use-session";
export {
  useSignUpMutation,
  useSignInMutation,
  useSignOutMutation,
  useResetPasswordMutation,
} from "./hooks/use-auth";

// ---- Profile --------------------------------------------------------------
export { profileService } from "./services/profile";
export { useMyProfile, useUpdateProfileMutation } from "./hooks/use-profile";

// ---- Company / Onboarding -------------------------------------------------
export { companyService } from "./services/company";
export {
  useOnboardingMutation,
  useMyCompanies,
  useCompanyQuery,
  useUpdateCompanyMutation,
} from "./hooks/use-company";

// ---- Equipment ------------------------------------------------------------
export { equipmentService } from "./services/equipment";
export {
  useEquipmentList,
  useEquipmentDetail,
  useCreateEquipmentMutation,
  useUpdateEquipmentMutation,
  useArchiveEquipmentMutation,
  useReactivateEquipmentMutation,
  useEquipmentPartners,
  useAddEquipmentPartnerMutation,
  useUpdateEquipmentPartnerMutation,
  useRemoveEquipmentPartnerMutation,
  useEquipmentTypes,
  useCreateEquipmentTypeMutation,
} from "./hooks/use-equipment";

// ---- Suppliers ------------------------------------------------------------
export { supplierService } from "./services/supplier";
export {
  useSupplierList,
  useSupplierDetail,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
} from "./hooks/use-supplier";

// ---- Partners -------------------------------------------------------------
export { partnerService } from "./services/partner";
export {
  usePartnerList,
  usePartnerDetail,
  useCreatePartnerMutation,
  useUpdatePartnerMutation,
  useDeletePartnerMutation,
} from "./hooks/use-partner";

// ---- Workers --------------------------------------------------------------
export { workerService } from "./services/worker";
export {
  useWorkerList,
  useWorkerDetail,
  useCreateWorkerMutation,
  useUpdateWorkerMutation,
  useArchiveWorkerMutation,
  useReactivateWorkerMutation,
  useWorkerEquipmentSkills,
  useAddWorkerEquipmentSkillMutation,
  useUpdateWorkerEquipmentSkillMutation,
  useRemoveWorkerEquipmentSkillMutation,
  useWorkerSoftwareSkills,
  useAddWorkerSoftwareSkillMutation,
  useRemoveWorkerSoftwareSkillMutation,
  useSoftwareList,
  useCreateSoftwareMutation,
  useEquipmentBrands,
  useCreateEquipmentBrandMutation,
  useEquipmentTypesList,
} from "./hooks/use-worker";

// ---- Schemas (for use in form validation) ---------------------------------
export { signUpSchema, signInSchema, updateProfileSchema, resetPasswordSchema } from "./schemas/auth";
export { createCompanySchema } from "./schemas/company";
export { createEquipmentSchema, updateEquipmentSchema, createEquipmentTypeSchema } from "./schemas/equipment";
export type { CreateEquipmentFormData, UpdateEquipmentFormData, CreateEquipmentTypeFormData } from "./schemas/equipment";
export { createSupplierSchema, updateSupplierSchema } from "./schemas/supplier";
export type { CreateSupplierFormData, UpdateSupplierFormData } from "./schemas/supplier";
export { createPartnerSchema, updatePartnerSchema } from "./schemas/partner";
export type { CreatePartnerFormData, UpdatePartnerFormData } from "./schemas/partner";
export {
  createWorkerSchema,
  updateWorkerSchema,
  addWorkerEquipmentSkillSchema,
  updateWorkerEquipmentSkillSchema,
  createSoftwareSchema,
  createEquipmentBrandSchema,
} from "./schemas/worker";
export type {
  CreateWorkerFormData,
  UpdateWorkerFormData,
  AddWorkerEquipmentSkillFormData,
  UpdateWorkerEquipmentSkillFormData,
  CreateSoftwareFormData,
  CreateEquipmentBrandFormData,
} from "./schemas/worker";

// ---- Legacy / utility -----------------------------------------------------
export { usePingQuery } from "./hooks/use-ping-query";
export { pingService } from "./services/ping";
export type { PingData } from "./services/ping";
