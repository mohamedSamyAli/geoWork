# Database Design — Login / Signup & Tenant Setup

> Branch: `loginSignup`
> Scope: Owner registration, company (tenant) creation, profile + membership linking

---

## A) Clarified Assumptions

| # | Assumption | Default chosen |
|---|-----------|----------------|
| 1 | **One owner = one company (initially)**. A user creates exactly one company at signup. Multi-company membership can be added later via `company_members`. | Single company at onboarding |
| 2 | **Supabase Auth handles email + password**. The `auth.users` table stores email and encrypted password. We do NOT store passwords ourselves. | Use `auth.users` for credentials |
| 3 | **Phone is stored on the profile**, not as a Supabase Auth phone provider (unless phone OTP login is enabled later). | `profiles.phone` column |
| 4 | **Owner name** is stored as `full_name` on the profile (single field, not first/last). | `profiles.full_name` |
| 5 | **Company only needs a `name`** for now — no address, logo, etc. | Minimal `companies` table |
| 6 | **Role enum** starts with `owner` and `member`. More roles (admin, manager) can be added later. | Postgres enum `app_role` |
| 7 | **Soft delete is NOT used** — hard delete with proper FK cascades. | Hard delete |
| 8 | **Currency/money not needed** in this scope. | Omitted |

---

## B) ERD Summary (Text)

```
auth.users (Supabase managed)
    │
    │ 1:1
    ▼
profiles
    id (PK, = auth.users.id)
    full_name
    phone
    avatar_url
    created_at / updated_at
    │
    │ 1:N (via company_members)
    ▼
company_members
    id (PK)
    user_id   → profiles.id
    company_id → companies.id
    role (app_role enum)
    created_at
    │
    │ N:1
    ▼
companies
    id (PK)
    name
    created_at / updated_at
```

### Relationships

| Relationship | Cardinality | Notes |
|-------------|-------------|-------|
| `auth.users` ↔ `profiles` | 1 : 1 | Same UUID PK |
| `profiles` ↔ `company_members` | 1 : N | A user can belong to multiple companies (future-proof) |
| `companies` ↔ `company_members` | 1 : N | A company has many members |

---

## C) Migration Plan

| # | File | Purpose |
|---|------|---------|
| 1 | `20250209000001_init_schema.sql` | Create `companies`, `profiles`, `company_members` tables, enum, indexes, and the `updated_at` trigger function |
| 2 | `20250209000002_rls_policies.sql` | Enable RLS on all tables and create policies + helper functions |
| 3 | `20250209000003_auth_trigger.sql` | Trigger on `auth.users` insert to auto-create a profile row |

### Why separate migrations?

- **01 (schema)** — pure DDL, can be reviewed independently.
- **02 (RLS)** — security layer, isolated so it can be audited/modified without touching schema.
- **03 (trigger)** — integration with Supabase Auth; separate so it can be disabled or swapped for an Edge Function approach.

---

## D) SQL Migrations

See files in `supabase/migrations/`:

- [20250209000001_init_schema.sql](../../supabase/migrations/20250209000001_init_schema.sql)
- [20250209000002_rls_policies.sql](../../supabase/migrations/20250209000002_rls_policies.sql)
- [20250209000003_auth_trigger.sql](../../supabase/migrations/20250209000003_auth_trigger.sql)

---

## E) RLS Design

### Strategy

1. **Deny by default** — `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` with no default-allow.
2. **Helper function** `public.get_my_company_ids()` returns all `company_id` values for the current user from `company_members`.
3. **Helper function** `public.has_company_role(uuid, app_role)` checks if the user has a specific role in a company.
4. All policies use `auth.uid()` to identify the current user.

### Policies per table

#### `profiles`

| Policy | Operation | Rule |
|--------|-----------|------|
| `profiles_select_own` | SELECT | `id = auth.uid()` |
| `profiles_update_own` | UPDATE | `id = auth.uid()` |

> Profiles are private to the owning user. Company member listing uses `company_members` + join.

#### `companies`

| Policy | Operation | Rule |
|--------|-----------|------|
| `companies_select_member` | SELECT | `id IN (get_my_company_ids())` |
| `companies_insert_authenticated` | INSERT | Any authenticated user (creates company at signup) |
| `companies_update_owner` | UPDATE | User is `owner` of this company |

#### `company_members`

| Policy | Operation | Rule |
|--------|-----------|------|
| `cm_select_same_company` | SELECT | `company_id IN (get_my_company_ids())` |
| `cm_insert_owner` | INSERT | User is `owner` of the target `company_id` OR is inserting their own row |
| `cm_delete_owner` | DELETE | User is `owner` of the target `company_id` |

---

## F) Triggers & Functions

### 1. `moddatetime` / `set_updated_at()`

A simple trigger function to auto-set `updated_at = now()` on every UPDATE.

```sql
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

Applied to: `profiles`, `companies`.

### 2. `handle_new_user()`

Trigger on `auth.users` AFTER INSERT — creates a `profiles` row automatically.

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

> **SECURITY DEFINER** is required because the trigger runs in the auth schema context and needs to insert into public.profiles bypassing RLS.

---

## G) Views

No views are needed for this scope. The tables are simple enough for direct queries.

---

## H) Backend / API Context Documentation

### 1. `profiles`

| Aspect | Detail |
|--------|--------|
| **Business meaning** | Internal user profile extending Supabase Auth. Stores display name, phone, avatar. |
| **Tenant scope** | NOT tenant-scoped. A profile belongs to a user, not a company. Company membership is via `company_members`. |
| **Lifecycle** | Created automatically via trigger on signup. Updated by the user. Deleted if account is deleted (cascade from auth). |
| **Fields** | `id` (uuid, PK, = auth.users.id), `full_name` (text, NOT NULL), `phone` (text, nullable), `avatar_url` (text, nullable), `created_at`, `updated_at` |
| **Relationships** | 1:1 with `auth.users`, 1:N with `company_members` |
| **Suggested endpoints** | `GET /profiles/me`, `PATCH /profiles/me` |
| **Typical queries** | `SELECT * FROM profiles WHERE id = auth.uid()` |
| **Validations** | `full_name` must not be empty (CHECK constraint). Phone format validation at app level. |

### 2. `companies`

| Aspect | Detail |
|--------|--------|
| **Business meaning** | The tenant / organization. Root scope for all future business entities. |
| **Tenant scope** | IS the tenant. `companies.id` is the `company_id` FK for all other business tables. |
| **Lifecycle** | Created during onboarding (after signup). Updated by owner. Deletion = dangerous (cascades everything). |
| **Fields** | `id` (uuid, PK), `name` (text, NOT NULL, min 1 char), `created_at`, `updated_at` |
| **Relationships** | 1:N with `company_members`, 1:N with all future business entities |
| **Suggested endpoints** | `POST /companies` (onboarding), `GET /companies/:id`, `PATCH /companies/:id` |
| **Typical queries** | `SELECT * FROM companies WHERE id IN (get_my_company_ids())` |
| **Validations** | `name` cannot be empty (CHECK constraint). |

### 3. `company_members`

| Aspect | Detail |
|--------|--------|
| **Business meaning** | Join table linking users to companies with a role. Determines tenant access. |
| **Tenant scope** | Scoped by `company_id`. |
| **Lifecycle** | First row created during onboarding (owner + company). Additional rows created when inviting members. |
| **Fields** | `id` (uuid, PK), `user_id` (uuid, FK → profiles), `company_id` (uuid, FK → companies), `role` (app_role enum), `created_at` |
| **Relationships** | N:1 with `profiles`, N:1 with `companies` |
| **Unique constraint** | `(user_id, company_id)` — a user can only have one role per company |
| **Suggested endpoints** | `POST /companies/:id/members`, `GET /companies/:id/members`, `DELETE /companies/:id/members/:userId` |
| **Typical queries** | `SELECT * FROM company_members WHERE company_id = $1` |
| **Validations** | Role must be valid enum value. Cannot have duplicate user+company pair. |
| **Performance** | Indexes on `(user_id)` and `(company_id)` for fast lookups in RLS helper functions. |

### Onboarding Flow (Signup → Company Creation)

```
1. Client calls supabase.auth.signUp({ email, password, options: { data: { full_name, phone } } })
2. Supabase Auth creates auth.users row
3. DB trigger auto-creates profiles row (from raw_user_meta_data)
4. Client calls POST /companies { name: "My Company" }
   → INSERT INTO companies (name) VALUES ($1) RETURNING id
   → INSERT INTO company_members (user_id, company_id, role) VALUES (auth.uid(), $new_company_id, 'owner')
5. User is now an owner of a company — all future entities scoped to this company_id
```

> **Important**: Step 4 (company + membership creation) should ideally be wrapped in a Postgres function or Supabase Edge Function to be atomic.

---

## I) Verification Queries

### 1. RLS isolation test

```sql
-- As user A (member of company 1):
SET request.jwt.claims = '{"sub": "<user_a_uuid>"}';
SELECT * FROM companies;
-- Should only return company 1

-- As user B (member of company 2):
SET request.jwt.claims = '{"sub": "<user_b_uuid>"}';
SELECT * FROM companies;
-- Should only return company 2
```

### 2. Profile auto-creation

```sql
-- After signup, verify profile exists:
SELECT p.id, p.full_name, p.phone
FROM profiles p
WHERE p.id = auth.uid();
```

### 3. Membership check

```sql
-- Verify owner membership after onboarding:
SELECT cm.role, c.name
FROM company_members cm
JOIN companies c ON c.id = cm.company_id
WHERE cm.user_id = auth.uid();
-- Should return: ('owner', 'Company Name')
```

### 4. Index usage

```sql
EXPLAIN ANALYZE
SELECT company_id FROM company_members WHERE user_id = '<some_uuid>';
-- Should show Index Scan on idx_company_members_user_id
```
