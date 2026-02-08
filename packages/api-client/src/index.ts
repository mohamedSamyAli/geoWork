// ---------------------------------------------------------------------------
// @repo/api-client — public API
// ---------------------------------------------------------------------------

// Initialisation
export { initApi } from "./init";
export { getSupabase } from "./client";

// React Query
export { createQueryClient } from "./query-client";
export { usePingQuery } from "./hooks/use-ping-query";

// Services (for non-hook usage)
export { pingService } from "./services/ping";
export type { PingData } from "./services/ping";
