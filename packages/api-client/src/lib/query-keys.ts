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
} as const;
