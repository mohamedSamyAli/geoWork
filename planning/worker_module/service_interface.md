# Workers Module - Service Interface Documentation

**Generated from:** Backend Services Implementation (Phase 2)
**Target Audience:** Frontend Developers (Web + Mobile)
**Last Updated:** 2026-02-12

---

## Overview

This document describes the available services and React Query hooks for the Workers Module, providing frontend developers with everything needed to integrate worker management functionality into both web (React Vite) and mobile (Expo) applications.

---

## Service: `workerService`

### Worker CRUD Operations

#### `list(companyId, filters?)`

Returns a paginated list of workers for the company.

**Parameters:**
- `companyId: string` - Company ID (required for tenant scoping)
- `filters?: {
    status?: "active" | "inactive",
    category?: "engineer" | "surveyor" | "assistant",
    search?: string,
    limit?: number,
    offset?: number
  }`

**Returns:** `Result<Worker[]>`

**Example:**
```typescript
const result = await workerService.list(companyId, {
  status: "active",
  category: "engineer",
  search: "John",
  limit: 20
});
```

---

#### `getById(workerId)`

Returns worker with all skills (equipment + software).

**Parameters:**
- `workerId: string`

**Returns:** `Result<WorkerWithSkills>`

**Example:**
```typescript
const result = await workerService.getById(workerId);
// result.data.equipment_skills - array of equipment skills
// result.data.software_skills - array of software skills with joined software data
```

---

#### `create(companyId, payload)`

Creates a new worker with optional skills.

**Parameters:**
- `companyId: string`
- `payload: CreateWorkerPayload`

**Returns:** `Result<Worker>`

**Payload Schema:**
```typescript
{
  name: string;              // Required, max 100 chars
  phone: string;             // Required
  category: "engineer" | "surveyor" | "assistant";  // Required
  salary_month: number;      // Required, non-negative
  salary_day: number;        // Required, non-negative
  equipment_skills?: Array<{
    equipment_type: string;
    equipment_brand: string;
    proficiency_rating: 1-5;
  }>;
  software_skill_ids?: string[];
}
```

**Validation Rules:**
- At least one of `salary_month` OR `salary_day` must be greater than 0
- `proficiency_rating` must be an integer between 1 and 5

---

#### `update(workerId, payload)`

Updates worker details.

**Parameters:**
- `workerId: string`
- `payload: UpdateWorkerPayload`

**Returns:** `Result<Worker>`

**Payload Schema:**
```typescript
{
  name?: string;
  phone?: string;
  category?: "engineer" | "surveyor" | "assistant";
  salary_month?: number;
  salary_day?: number;
  status?: "active" | "inactive";
}
```

---

#### `archive(workerId)`

Sets worker status to inactive (soft delete).

**Parameters:**
- `workerId: string`

**Returns:** `Result<Worker>`

---

#### `reactivate(workerId)`

Sets worker status to active.

**Parameters:**
- `workerId: string`

**Returns:** `Result<Worker>`

---

### Equipment Skills

#### `getEquipmentSkills(workerId)`

Returns all equipment skills for a worker.

**Parameters:**
- `workerId: string`

**Returns:** `Result<WorkerEquipmentSkill[]>`

---

#### `addEquipmentSkill(workerId, payload)`

Adds an equipment skill with rating.

**Parameters:**
- `workerId: string`
- `payload: {
    equipment_type: string,
    equipment_brand: string,
    proficiency_rating: 1-5
  }`

**Returns:** `Result<WorkerEquipmentSkill>`

---

#### `updateEquipmentSkill(skillId, rating)`

Updates the proficiency rating.

**Parameters:**
- `skillId: string`
- `rating: 1-5`

**Returns:** `Result<WorkerEquipmentSkill>`

---

#### `removeEquipmentSkill(skillId)`

Removes an equipment skill.

**Parameters:**
- `skillId: string`

**Returns:** `Result<void>`

---

### Software Skills

#### `getSoftwareSkills(workerId)`

Returns all software skills for a worker with joined software data.

**Parameters:**
- `workerId: string`

**Returns:** `Result<(WorkerSoftwareSkill & { software: Software })[]>`

---

#### `addSoftwareSkill(workerId, softwareId)`

Adds a software skill.

**Parameters:**
- `workerId: string`
- `softwareId: string`

**Returns:** `Result<WorkerSoftwareSkill>`

---

#### `removeSoftwareSkill(skillId)`

Removes a software skill.

**Parameters:**
- `skillId: string`

**Returns:** `Result<void>`

---

### Master Data

#### `getSoftwareList(companyId)`

Returns all software (system + company). System software (company_id IS NULL) is included for all companies.

**Parameters:**
- `companyId: string`

**Returns:** `Result<Software[]>`

**Usage:** Populate dropdowns for software skill selection.

---

#### `createSoftware(companyId, payload)`

Creates new software (quick-add feature).

**Parameters:**
- `companyId: string`
- `payload: { name: string }`

**Returns:** `Result<Software>`

---

#### `getEquipmentBrands(companyId)`

Returns all equipment brands (system + company).

**Parameters:**
- `companyId: string`

**Returns:** `Result<EquipmentBrand[]>`

**Usage:** Populate dropdowns for equipment brand selection.

---

#### `createEquipmentBrand(companyId, payload)`

Creates new equipment brand (quick-add feature).

**Parameters:**
- `companyId: string`
- `payload: { name: string }`

**Returns:** `Result<EquipmentBrand>`

---

#### `getEquipmentTypes(companyId)`

Returns all equipment types (reused from equipment module).

**Parameters:**
- `companyId: string`

**Returns:** `Result<Array<{ id: string; name: string }>>`

**Usage:** Populate dropdowns for equipment type selection.

---

## React Query Hooks

All service methods have corresponding React Query hooks for automatic caching, loading states, and error handling.

### Worker List Hooks

#### `useWorkerList(companyId, filters?)`

```typescript
const { data: result, isLoading, error } = useWorkerList(
  companyId,
  { status: "active", category: "engineer" }
);

const workers = result?.data ?? [];
const apiError = result?.error;
```

**Query Key:** `["workers", companyId, filters]`

---

#### `useWorkerDetail(workerId)`

```typescript
const { data: result, isLoading } = useWorkerDetail(workerId);
const worker = result?.data;
```

**Query Key:** `["workers", workerId]`

---

### Worker Mutation Hooks

#### `useCreateWorkerMutation()`

```typescript
const createMutation = useCreateWorkerMutation();

const handleCreate = async () => {
  const result = await createMutation.mutateAsync({
    companyId,
    payload: { name: "John", phone: "+123...", category: "engineer", salary_month: 5000, salary_day: 200 }
  });

  if (result.error) {
    // Handle error
  }
};

// Access pending state: createMutation.isPending
```

**Cache Invalidation:** Invalidates `["workers", companyId]` on success

---

#### `useUpdateWorkerMutation()`

```typescript
const updateMutation = useUpdateWorkerMutation();

await updateMutation.mutateAsync({
  workerId,
  payload: { name: "John Updated" }
});
```

**Cache Invalidation:** Invalidates worker detail and list queries

---

#### `useArchiveWorkerMutation()`

```typescript
const archiveMutation = useArchiveWorkerMutation();
await archiveMutation.mutateAsync(workerId);
```

---

#### `useReactivateWorkerMutation()`

```typescript
const reactivateMutation = useReactivateWorkerMutation();
await reactivateMutation.mutateAsync(workerId);
```

---

### Equipment Skill Hooks

#### `useWorkerEquipmentSkills(workerId)`

```typescript
const { data: result } = useWorkerEquipmentSkills(workerId);
const skills = result?.data ?? [];
```

**Query Key:** `["workers", workerId, "equipment-skills"]`

---

#### `useAddWorkerEquipmentSkillMutation()`

```typescript
const addSkillMutation = useAddWorkerEquipmentSkillMutation();

await addSkillMutation.mutateAsync({
  workerId,
  payload: {
    equipment_type: "Total Station",
    equipment_brand: "Topcon",
    proficiency_rating: 4
  }
});
```

**Cache Invalidation:** Invalidates equipment skills and worker detail

---

#### `useUpdateWorkerEquipmentSkillMutation()`

```typescript
const updateSkillMutation = useUpdateWorkerEquipmentSkillMutation();

await updateSkillMutation.mutateAsync({
  skillId,
  workerId,
  rating: 5
});
```

---

#### `useRemoveWorkerEquipmentSkillMutation()`

```typescript
const removeSkillMutation = useRemoveWorkerEquipmentSkillMutation();

await removeSkillMutation.mutateAsync({
  skillId,
  workerId
});
```

---

### Software Skill Hooks

#### `useWorkerSoftwareSkills(workerId)`

```typescript
const { data: result } = useWorkerSoftwareSkills(workerId);
const skills = result?.data ?? [];
```

**Query Key:** `["workers", workerId, "software-skills"]`

---

#### `useAddWorkerSoftwareSkillMutation()`

```typescript
const addSoftwareMutation = useAddWorkerSoftwareSkillMutation();

await addSoftwareMutation.mutateAsync({
  workerId,
  softwareId
});
```

---

#### `useRemoveWorkerSoftwareSkillMutation()`

```typescript
const removeSoftwareMutation = useRemoveWorkerSoftwareSkillMutation();

await removeSoftwareMutation.mutateAsync({
  skillId,
  workerId
});
```

---

### Master Data Hooks

#### `useSoftwareList(companyId)`

```typescript
const { data: result } = useSoftwareList(companyId);
const softwareList = result?.data ?? [];
```

**Query Key:** `["software", companyId]`

---

#### `useCreateSoftwareMutation()`

```typescript
const createSoftwareMutation = useCreateSoftwareMutation();

await createSoftwareMutation.mutateAsync({
  companyId,
  payload: { name: "Civil3D" }
});
```

---

#### `useEquipmentBrands(companyId)`

```typescript
const { data: result } = useEquipmentBrands(companyId);
const brands = result?.data ?? [];
```

**Query Key:** `["equipment-brands", companyId]`

---

#### `useCreateEquipmentBrandMutation()`

```typescript
const createBrandMutation = useCreateEquipmentBrandMutation();

await createBrandMutation.mutateAsync({
  companyId,
  payload: { name: "Leica" }
});
```

---

#### `useEquipmentTypesList(companyId)`

```typescript
const { data: result } = useEquipmentTypesList(companyId);
const types = result?.data ?? [];
```

**Query Key:** `["equipment-types", companyId]`

---

## Zod Schemas (Form Validation)

Import these schemas for use with React Hook Form + Zod Resolver:

```typescript
import {
  createWorkerSchema,
  updateWorkerSchema,
  addWorkerEquipmentSkillSchema,
  updateWorkerEquipmentSkillSchema,
  createSoftwareSchema,
  createEquipmentBrandSchema,
  type CreateWorkerFormData,
  type UpdateWorkerFormData,
  // ... other form data types
} from "@repo/api-client";
```

---

## Error Handling

All service functions return `Result<T>`:

```typescript
type Result<T> =
  | { data: T; error: null }
  | { data: null; error: ApiError };
```

**ApiError Shape:**
```typescript
interface ApiError {
  code: string;
  message: string;      // User-friendly message
  status?: number;      // HTTP status code (if applicable)
  details?: unknown;    // Additional error details
}
```

**Worker-Specific Error Messages:**
- "A worker with this phone number already exists."
- "Software with this name already exists."
- "An equipment brand with this name already exists."
- "This equipment skill already exists for the worker."
- "This software skill is already assigned to the worker."
- "At least one salary must be greater than 0"

---

## Query Key Reference

For manual cache invalidation in your app:

```typescript
import { queryKeys } from "@repo/api-client";

// Workers
queryKeys.workers.all(companyId)          // All workers for company
queryKeys.workers.detail(workerId)        // Single worker
queryKeys.workers.equipmentSkills(workerId)  // Worker's equipment skills
queryKeys.workers.softwareSkills(workerId)   // Worker's software skills
queryKeys.workers.software(companyId)      // All software
queryKeys.workers.equipmentBrands(companyId) // All equipment brands
queryKeys.workers.equipmentTypes(companyId)  // All equipment types
```

---

## Example: Complete Worker List + Create Flow

```typescript
import { useWorkerList, useCreateWorkerMutation, useSoftwareList } from "@repo/api-client";

function WorkerManagement() {
  const companyId = useActiveCompanyId();

  // Fetch workers
  const { data: workersResult, isLoading } = useWorkerList(companyId, {
    status: "active"
  });

  // Fetch software for dropdowns
  const { data: softwareResult } = useSoftwareList(companyId);

  // Create mutation
  const createMutation = useCreateWorkerMutation();

  const handleCreate = async (formData: CreateWorkerFormData) => {
    const result = await createMutation.mutateAsync({
      companyId,
      payload: formData
    });

    if (result.error) {
      toast.error(result.error.message);
    } else {
      toast.success("Worker created successfully!");
    }
  };

  if (isLoading) return <Loading />;

  return (
    <div>
      {workersResult?.data?.map(worker => (
        <WorkerCard key={worker.id} worker={worker} />
      ))}
      <WorkerForm onSubmit={handleCreate} softwareOptions={softwareResult?.data} />
    </div>
  );
}
```

---

**Document End**

**Next Step:** Frontend implementation (Phase 3: Web App, Phase 4: Mobile App)
