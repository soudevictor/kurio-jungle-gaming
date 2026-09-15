import type { QueryClient } from "@tanstack/react-query"
import { ApiError } from "@/lib/api/client"
import { authApi } from "@/lib/api/endpoints"
import { queryKeys } from "@/lib/query/keys"
import type { Session } from "@/types/domain"

/** Resolves the current session for route guards. Never throws: an expired
 * or missing session simply resolves to `null` so `beforeLoad` can redirect. */
export async function ensureSession(queryClient: QueryClient): Promise<Session | null> {
  try {
    return await queryClient.ensureQueryData({
      queryKey: queryKeys.session(),
      queryFn: authApi.session,
      staleTime: 60_000,
    })
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.code === "unauthorized")) {
      return null
    }
    throw err
  }
}
