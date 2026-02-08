// ---------------------------------------------------------------------------
// usePingQuery — React Query hook wrapping pingService
// ---------------------------------------------------------------------------

import { useQuery } from "@tanstack/react-query";
import { pingService } from "../services/ping";

export function usePingQuery() {
  return useQuery({
    queryKey: ["ping"],
    queryFn: () => pingService.ping(),
  });
}
