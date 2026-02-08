# Backend / API Client Documentation

> Package: `@repo/api-client`
> Branch: `loginSignup`
> Scope: Authentication, profile management, company onboarding

---

## Table of Contents

1. [Architecture Overview](#a-architecture-overview)
2. [Package Structure](#b-package-structure)
3. [Environment & Supabase Client Setup](#c-environment--supabase-client-setup)
4. [Shared Types](#d-shared-types)
5. [Zod Validation Schemas](#e-zod-validation-schemas)
6. [Service Layer](#f-service-layer)
7. [React Query Hooks](#g-react-query-hooks)
8. [Query Keys & Cache Strategy](#h-query-keys--cache-strategy)
9. [Error Handling](#i-error-handling)
10. [Onboarding Flow (End-to-End)](#j-onboarding-flow-end-to-end)
11. [Usage Examples](#k-usage-examples)
12. [SQL Migrations](#l-sql-migrations)
13. [Testing Strategy](#m-testing-strategy)

---

## A) Architecture Overview

```
┌─────────────┐     ┌─────────────┐
│  apps/web   │     │ apps/mobile │
│  (Vite)     │     │ (Expo)      │
└──────┬──────┘     └──────┬──────┘
       │                   │
       └─────────┬─────────┘
                 │  import from
                 ▼
       ┌─────────────────┐
       │ @repo/api-client │  ← hooks + services + schemas
       └────────┬────────┘
                │  depends on
          ┌─────┴─────┐
          ▼           ▼
   @repo/types   @repo/config
   (TS types)    (env validation)
```

**Key principles:**
- `@repo/api-client` contains ALL shared backend logic (services, hooks, schemas)
- Zero app-specific code — works in both React (Vite) and React Native (Expo)
- Cross-platform: no `localStorage`, `window`, or Node-only APIs
- Environment is injected at boot via `initApi()` — never reads `import.meta.env` or `process.env` directly

---

## B) Package Structure

```
packages/api-client/src/
├── index.ts                  # Public API — single barrel export
├── init.ts                   # initApi() — called once from each app
├── client.ts                 # Supabase client singleton
├── query-client.ts           # React Query client factory
├── lib/
│   ├── errors.ts             # Error mapping (Supabase → ApiError)
│   └── query-keys.ts         # Centralised query key factory
├── schemas/
│   ├── auth.ts               # Zod: signUp, signIn, updateProfile, resetPassword
│   └── company.ts            # Zod: createCompany
├── services/
│   ├── auth.ts               # signUp, signIn, signOut, getSession, resetPassword
│   ├── profile.ts            # getMyProfile, updateMyProfile
│   ├── company.ts            # onboard, getMyCompanies, getById, update
│   └── ping.ts               # (legacy) connectivity test
└── hooks/
    ├── use-session.ts         # useSession() — reactive auth state
    ├── use-auth.ts            # useSignUpMutation, useSignInMutation, etc.
    ├── use-profile.ts         # useMyProfile, useUpdateProfileMutation
    ├── use-company.ts         # useOnboardingMutation, useMyCompanies, etc.
    └── use-ping-query.ts      # (legacy) ping hook
```

```
packages/types/src/
└── index.ts                   # ApiError, Result<T>, Profile, Company,
                               # CompanyMember, AppRole, all DTOs
```

---

## C) Environment & Supabase Client Setup

### Initialisation

Both apps call `initApi()` once at startup, passing platform-specific env vars:

```ts
// apps/web/src/main.tsx
import { initApi } from "@repo/api-client";

initApi({
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
});
```

```ts
// apps/mobile/app/_layout.tsx
import { initApi } from "@repo/api-client";

initApi({
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL!,
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
});
```

### What `initApi()` does

1. Validates env vars via Zod (`@repo/config`)
2. Creates and caches a Supabase client singleton
3. Must be called **before** any service or hook is used

### Accessing the client

```ts
import { getSupabase } from "@repo/api-client";
const supabase = getSupabase(); // throws if initApi() wasn't called
```

---

## D) Shared Types

All types live in `@repo/types`. The naming convention:

| Type | Meaning |
|------|---------|
| `Profile` | DB row type for `profiles` table |
| `Company` | DB row type for `companies` table |
| `CompanyMember` | DB row type for `company_members` table |
| `AppRole` | `"owner" \| "member"` enum |
| `SignUpPayload` | Input DTO for signup |
| `SignInPayload` | Input DTO for login |
| `UpdateProfilePayload` | Partial update DTO for profile |
| `CreateCompanyPayload` | Input DTO for company creation |
| `OnboardingResult` | Return value from onboarding RPC |
| `SessionUser` | Minimal user shape from session |
| `ActiveMembership` | Company + role for current user |
| `ApiError` | Standard error shape `{ code, message, status?, details? }` |
| `Result<T>` | Discriminated union: `{ data: T, error: null } \| { data: null, error: ApiError }` |

### Result pattern

Every service function returns `Result<T>`. Callers never need try/catch:

```ts
const result = await authService.signIn({ email, password });
if (result.error) {
  console.error(result.error.message);
  return;
}
console.log(result.data); // Session
```

---

## E) Zod Validation Schemas

Schemas are exported from `@repo/api-client` so apps can reuse them for form validation.

### `signUpSchema`

```ts
{
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().min(1),
  phone: z.string().optional(),
}
```

### `signInSchema`

```ts
{
  email: z.string().email(),
  password: z.string().min(1),
}
```

### `updateProfileSchema`

```ts
{
  full_name: z.string().min(1).optional(),
  phone: z.string().nullable().optional(),
  avatar_url: z.string().url().nullable().optional(),
}
```

### `resetPasswordSchema`

```ts
{
  email: z.string().email(),
}
```

### `createCompanySchema`

```ts
{
  name: z.string().min(1),
}
```

**Usage in forms:**

```ts
import { signUpSchema } from "@repo/api-client";

// With React Hook Form + @hookform/resolvers/zod
const form = useForm({ resolver: zodResolver(signUpSchema) });

// Or manual validation
const result = signUpSchema.safeParse(formValues);
if (!result.success) {
  // result.error.flatten() gives field-level errors
}
```

---

## F) Service Layer

### `authService`

| Method | Signature | Description |
|--------|-----------|-------------|
| `signUp` | `(payload: SignUpPayload) → Result<{ userId: string }>` | Register. Supabase Auth creates `auth.users`; DB trigger auto-creates `profiles` from metadata. |
| `signIn` | `(payload: SignInPayload) → Result<Session>` | Email + password login. Returns the full Supabase session. |
| `signOut` | `() → Result<null>` | Sign out the current user. |
| `getSession` | `() → Result<Session \| null>` | Get the current session (null if not logged in). |
| `resetPassword` | `(email: string) → Result<null>` | Send a password reset email. |
| `onAuthStateChange` | `(callback) → () => void` | Subscribe to auth events. Returns an unsubscribe function. |

### `profileService`

| Method | Signature | Description |
|--------|-----------|-------------|
| `getMyProfile` | `() → Result<Profile>` | Fetch authenticated user's profile (RLS: `id = auth.uid()`). |
| `updateMyProfile` | `(payload: UpdateProfilePayload) → Result<Profile>` | Update own profile. Zod-validated. Returns updated row. |

### `companyService`

| Method | Signature | Description |
|--------|-----------|-------------|
| `onboard` | `(payload: CreateCompanyPayload) → Result<OnboardingResult>` | **Onboarding**: creates company + owner membership atomically via RPC. Falls back to two inserts if RPC is unavailable. |
| `getMyCompanies` | `() → Result<(CompanyMember & { company: Company })[]>` | All companies the user belongs to, with membership info. |
| `getCompanyById` | `(id: string) → Result<Company>` | Single company (RLS: must be a member). |
| `updateCompany` | `(id: string, payload: CreateCompanyPayload) → Result<Company>` | Update company name (RLS: must be owner). |

### RLS awareness

All queries go through the Supabase client which sends the user's JWT. Postgres RLS policies enforce:
- **profiles**: users can only read/update their own profile
- **companies**: users can only see companies they belong to; only owners can update
- **company_members**: users can see members in their companies; only owners can add/remove

The service layer does **not** manually filter by `company_id` — RLS handles it. The service layer does ensure `auth.uid()` is present before making queries (returns `NOT_AUTHENTICATED` error early).

---

## G) React Query Hooks

### Session & Auth

| Hook | Type | Description |
|------|------|-------------|
| `useSession()` | Query | Returns `{ session, user, isAuthenticated }`. Auto-refreshes on auth state changes via `onAuthStateChange` listener. `staleTime: Infinity` — only invalidated by real auth events. |
| `useSignUpMutation()` | Mutation | Wraps `authService.signUp`. Invalidates session cache on success. |
| `useSignInMutation()` | Mutation | Wraps `authService.signIn`. Invalidates session, profile, and companies cache on success. |
| `useSignOutMutation()` | Mutation | Wraps `authService.signOut`. **Clears all cached data** (`queryClient.clear()`). |
| `useResetPasswordMutation()` | Mutation | Wraps `authService.resetPassword`. No cache side effects. |

### Profile

| Hook | Type | Description |
|------|------|-------------|
| `useMyProfile(enabled?)` | Query | Fetches `profileService.getMyProfile()`. Pass `enabled=false` to disable until authenticated. |
| `useUpdateProfileMutation()` | Mutation | Wraps `profileService.updateMyProfile`. Invalidates profile cache on success. |

### Company / Onboarding

| Hook | Type | Description |
|------|------|-------------|
| `useOnboardingMutation()` | Mutation | Creates company + owner membership. Invalidates companies cache. |
| `useMyCompanies(enabled?)` | Query | All companies the user belongs to. |
| `useCompanyQuery(id?)` | Query | Single company. Disabled when `id` is undefined. |
| `useUpdateCompanyMutation()` | Mutation | Update company. Invalidates detail + list cache. |

### Hook return shape

All query hooks return the standard React Query shape (`data`, `isLoading`, `error`, etc.).

For queries, `data` is a `Result<T>` — so `data.data` is the payload and `data.error` is the `ApiError`:

```ts
const { data: result, isLoading } = useMyProfile();

if (isLoading) return <Spinner />;
if (result?.error) return <ErrorMsg error={result.error} />;

const profile = result.data; // Profile
```

For mutations, call `.mutate()` or `.mutateAsync()`:

```ts
const signUp = useSignUpMutation();

signUp.mutate(
  { email, password, full_name },
  {
    onSuccess: (result) => {
      if (result.error) { /* show error */ }
      else { /* navigate to onboarding */ }
    },
  }
);
```

---

## H) Query Keys & Cache Strategy

All keys are defined in `queryKeys` (exported from `@repo/api-client`):

```ts
queryKeys.auth.session         // ["auth", "session"]
queryKeys.profile.me           // ["profile", "me"]
queryKeys.companies.all        // ["companies"]
queryKeys.companies.detail(id) // ["companies", "<id>"]
queryKeys.companies.members(id)// ["companies", "<id>", "members"]
```

### Invalidation rules

| Event | Invalidated keys |
|-------|-----------------|
| Sign up success | `auth.session` |
| Sign in success | `auth.session`, `profile.me`, `companies.all` |
| Sign out | **All** (`queryClient.clear()`) |
| Profile update | `profile.me` |
| Onboarding (create company) | `companies.all` |
| Update company | `companies.detail(id)`, `companies.all` |
| Auth state change (listener) | `auth.session` |

---

## I) Error Handling

### Error model

```ts
interface ApiError {
  code: string;     // Machine-readable code (e.g. "AUTH_ERROR", "DB_ERROR")
  message: string;  // Human-readable message
  status?: number;  // HTTP status if applicable
  details?: unknown; // Extra details from Supabase
}
```

### Error mapping

| Source | Mapper | Example code |
|--------|--------|-------------|
| Supabase Auth errors | `mapAuthError()` | `"invalid_credentials"` |
| Supabase DB/PostgREST errors | `mapSupabaseError()` | `"PGRST116"` |
| Zod validation errors | `mapUnknownError()` | `"UNKNOWN"` (Zod throws with descriptive message) |
| Unknown thrown values | `mapUnknownError()` | `"UNKNOWN"` |

### Helper functions

```ts
import { ok, fail } from "./lib/errors";

return ok(data);   // { data, error: null }
return fail(err);  // { data: null, error: ApiError }
```

---

## J) Onboarding Flow (End-to-End)

```
  Client                       Supabase Auth              Postgres
  ──────                       ──────────────             ────────
    │                                │                        │
    │  1. signUp(email, pw, meta)    │                        │
    │ ──────────────────────────────>│                        │
    │                                │  INSERT auth.users     │
    │                                │───────────────────────>│
    │                                │                        │
    │                                │  TRIGGER: handle_new_user()
    │                                │                        │──┐
    │                                │                        │  │ INSERT profiles
    │                                │                        │<─┘
    │                                │                        │
    │  ← { userId }                  │                        │
    │                                │                        │
    │  2. onboard({ name })          │                        │
    │ ─────────────────────────────────────────(RPC)─────────>│
    │                                │                        │
    │                                │  create_company_with_owner()
    │                                │                        │──┐
    │                                │                        │  │ INSERT companies
    │                                │                        │  │ INSERT company_members (owner)
    │                                │                        │<─┘
    │                                │                        │
    │  ← { company_id, membership_id }                       │
    │                                │                        │
    │  User is now authenticated with a profile              │
    │  and owns a company. Ready to use the app.             │
```

### Step-by-step

1. **`signUp()`** — calls `supabase.auth.signUp()` with `options.data: { full_name, phone }`
2. Supabase Auth creates the `auth.users` row
3. The `on_auth_user_created` trigger fires `handle_new_user()`, which inserts a `profiles` row reading `full_name` and `phone` from `raw_user_meta_data`
4. Client now has a session and a profile
5. **`onboard({ name })`** — calls the `create_company_with_owner` RPC which atomically:
   - Inserts a row into `companies`
   - Inserts a `company_members` row with `role = 'owner'` for `auth.uid()`
6. User now has a company and is the owner — all future entities will be scoped to this `company_id`

### Login flow

1. **`signIn()`** — calls `supabase.auth.signInWithPassword()`
2. Returns a Supabase session (JWT with user ID)
3. All subsequent Supabase queries include this JWT
4. RLS policies use `auth.uid()` from the JWT to enforce access control

---

## K) Usage Examples

### Sign Up (in any app)

```ts
import { useSignUpMutation, useOnboardingMutation } from "@repo/api-client";

function useSignUpFlow() {
  const signUp = useSignUpMutation();
  const onboard = useOnboardingMutation();

  async function handleSignUp(email: string, password: string, fullName: string, companyName: string) {
    // Step 1: Create the account
    const authResult = await signUp.mutateAsync({ email, password, full_name: fullName });
    if (authResult.error) throw new Error(authResult.error.message);

    // Step 2: Create the company (onboarding)
    const companyResult = await onboard.mutateAsync({ name: companyName });
    if (companyResult.error) throw new Error(companyResult.error.message);

    return companyResult.data; // { company_id, membership_id }
  }

  return { handleSignUp, isLoading: signUp.isPending || onboard.isPending };
}
```

### Sign In

```ts
import { useSignInMutation } from "@repo/api-client";

const signIn = useSignInMutation();

signIn.mutate(
  { email: "user@example.com", password: "securepassword" },
  {
    onSuccess: (result) => {
      if (result.data) {
        // Session is now active. Navigate to dashboard.
      } else {
        // Show result.error.message
      }
    },
  }
);
```

### Check Auth State

```ts
import { useSession } from "@repo/api-client";

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useSession();

  if (isLoading) return <Spinner />;
  if (!isAuthenticated) return <LoginScreen />;
  return <>{children}</>;
}
```

### Read / Update Profile

```ts
import { useMyProfile, useUpdateProfileMutation } from "@repo/api-client";

function ProfileScreen() {
  const { data: result } = useMyProfile();
  const updateProfile = useUpdateProfileMutation();

  const profile = result?.data;

  function handleSave(fullName: string) {
    updateProfile.mutate({ full_name: fullName });
  }

  // ...
}
```

### Get User's Companies

```ts
import { useMyCompanies } from "@repo/api-client";

function CompanySelector() {
  const { data: result } = useMyCompanies();
  const memberships = result?.data ?? [];

  return (
    <ul>
      {memberships.map((m) => (
        <li key={m.id}>{m.company.name} ({m.role})</li>
      ))}
    </ul>
  );
}
```

### Form Validation with Zod Schemas

```ts
import { signUpSchema } from "@repo/api-client";

// Validate before submitting
const parsed = signUpSchema.safeParse({
  email: "test@example.com",
  password: "short",
  full_name: "Test User",
});

if (!parsed.success) {
  const fieldErrors = parsed.error.flatten().fieldErrors;
  // { password: ["Password must be at least 8 characters"] }
}
```

---

## L) SQL Migrations

| # | File | Purpose |
|---|------|---------|
| 1 | `20250209000001_init_schema.sql` | `app_role` enum, `profiles`, `companies`, `company_members` tables, indexes, `set_updated_at()` trigger |
| 2 | `20250209000002_rls_policies.sql` | RLS on all tables, `get_my_company_ids()` + `has_company_role()` helpers, all policies |
| 3 | `20250209000003_auth_trigger.sql` | `handle_new_user()` trigger on `auth.users` insert → auto-creates profile |
| 4 | `20250209000004_onboarding_rpc.sql` | `create_company_with_owner(company_name)` RPC for atomic onboarding |

### Onboarding RPC

```sql
CREATE OR REPLACE FUNCTION public.create_company_with_owner(company_name text)
RETURNS json AS $$
DECLARE
  _company_id uuid;
  _member_id  uuid;
BEGIN
  INSERT INTO public.companies (name) VALUES (company_name)
    RETURNING id INTO _company_id;

  INSERT INTO public.company_members (user_id, company_id, role)
    VALUES (auth.uid(), _company_id, 'owner')
    RETURNING id INTO _member_id;

  RETURN json_build_object(
    'company_id',    _company_id,
    'membership_id', _member_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Why SECURITY DEFINER?** The function runs as the DB owner so the company insert + membership insert happen in a single transaction regardless of RLS evaluation order.

---

## M) Testing Strategy

### 1. Zod schema tests (unit)

```ts
import { signUpSchema } from "@repo/api-client";

test("rejects short password", () => {
  const result = signUpSchema.safeParse({
    email: "a@b.com",
    password: "short",
    full_name: "Test",
  });
  expect(result.success).toBe(false);
});

test("accepts valid signup", () => {
  const result = signUpSchema.safeParse({
    email: "a@b.com",
    password: "longpassword",
    full_name: "Test User",
  });
  expect(result.success).toBe(true);
});
```

### 2. Service tests (with mocked Supabase)

Mock `getSupabase()` to return a fake Supabase client. Test that services call the correct methods and map errors properly.

```ts
import { authService } from "@repo/api-client";

// Mock getSupabase() to return a mock client
jest.mock("../client", () => ({
  getSupabase: () => mockSupabase,
}));

test("signIn maps auth error", async () => {
  mockSupabase.auth.signInWithPassword.mockResolvedValue({
    data: { session: null, user: null },
    error: { message: "Invalid credentials", status: 400, code: "invalid_credentials" },
  });

  const result = await authService.signIn({ email: "a@b.com", password: "wrong" });
  expect(result.error?.code).toBe("invalid_credentials");
});
```

### 3. Integration / E2E

- Use `supabase start` (local Supabase) for integration tests
- Run the full signup → onboarding → login → profile fetch flow
- Verify RLS isolation: user A cannot see user B's company

---

## Appendix: Full Export Map

All public exports from `@repo/api-client`:

```ts
// Initialisation
initApi, getSupabase, createQueryClient

// Query keys
queryKeys

// Auth
authService, useSession
useSignUpMutation, useSignInMutation, useSignOutMutation, useResetPasswordMutation

// Profile
profileService, useMyProfile, useUpdateProfileMutation

// Company
companyService, useOnboardingMutation, useMyCompanies, useCompanyQuery, useUpdateCompanyMutation

// Schemas
signUpSchema, signInSchema, updateProfileSchema, resetPasswordSchema, createCompanySchema

// Legacy
usePingQuery, pingService
```
