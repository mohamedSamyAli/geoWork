// ---------------------------------------------------------------------------
// React Query — QueryClient factory
// ---------------------------------------------------------------------------

import { QueryClient } from "@tanstack/react-query";

/** Create a QueryClient with sensible defaults. Each app should call this once. */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        retry: 2,
      },
    },
  });
}
