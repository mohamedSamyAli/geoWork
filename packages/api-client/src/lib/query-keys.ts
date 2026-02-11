// ---------------------------------------------------------------------------
// Query key factory — single source of truth for React Query cache keys
// ---------------------------------------------------------------------------

export const queryKeys = {
  auth: {
    session: ["auth", "session"] as const,
  },
  profile: {
    me: ["profile", "me"] as const,
  },
  companies: {
    all: ["companies"] as const,
    detail: (id: string) => ["companies", id] as const,
    members: (companyId: string) => ["companies", companyId, "members"] as const,
  },
  equipment: {
    all: (companyId: string) => ["equipment", companyId] as const,
    detail: (id: string) => ["equipment", "detail", id] as const,
    partners: (equipmentId: string) => ["equipment", equipmentId, "partners"] as const,
    types: (companyId: string) => ["equipment-types", companyId] as const,
  },
  suppliers: {
    all: (companyId: string) => ["suppliers", companyId] as const,
    detail: (id: string) => ["suppliers", "detail", id] as const,
  },
  partners: {
    all: (companyId: string) => ["partners", companyId] as const,
    detail: (id: string) => ["partners", "detail", id] as const,
  },
} as const;
