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

// ---- Schemas (for use in form validation) ---------------------------------
export { signUpSchema, signInSchema, updateProfileSchema, resetPasswordSchema } from "./schemas/auth";
export { createCompanySchema } from "./schemas/company";

// ---- Legacy / utility -----------------------------------------------------
export { usePingQuery } from "./hooks/use-ping-query";
export { pingService } from "./services/ping";
export type { PingData } from "./services/ping";
