import { QueryClient } from "@tanstack/react-query";

/**
 * One client shared by every island on a page. Each island is its own React
 * root, but they import this module once, so cached queries (e.g. ["me"]) and
 * invalidations reach all islands.
 */
export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
});
