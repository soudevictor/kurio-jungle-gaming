import { QueryClient } from "@tanstack/react-query"
import { ApiError } from "@/lib/api/client"

/**
 * Cache / retry policy (documented per README §4):
 * - `staleTime` of 15s on reads: catalog/detail/cart feel instant on
 *   back/forward navigation while still refreshing often enough for the
 *   realtime price/availability story to matter.
 * - Retries are disabled for anything the user can act on directly
 *   (4xx never retries); transient network/5xx retries twice with backoff.
 * - `refetchOnWindowFocus` is on so returning to a stale tab reconciles with
 *   the mocked "server" the same way the realtime reconnect flow does.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: true,
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status > 0 && error.status < 500) return false
        return failureCount < 2
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
    },
    mutations: {
      retry: false,
    },
  },
})
