import { useQueryClient } from "@tanstack/react-query"
import { useNavigate, useRouterState } from "@tanstack/react-router"
import { useEffect, useRef } from "react"
import { toast } from "sonner"
import { onSessionExpired } from "@/lib/api/client"
import { setStoredToken } from "@/lib/auth/storage"
import { queryKeys } from "@/lib/query/keys"

/**
 * Reacts to a 401 from any authenticated request (not just the session
 * check itself) by clearing the dead session and sending the user to
 * /login with `redirect` set to where they were — so submitting the login
 * form resumes exactly where expiry interrupted them, checkout included.
 */
export function SessionExpiryWatcher() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.href })
  const pathnameRef = useRef(pathname)
  pathnameRef.current = pathname

  useEffect(() => {
    return onSessionExpired(() => {
      setStoredToken(null)
      queryClient.setQueryData(queryKeys.session(), null)
      queryClient.removeQueries({ queryKey: queryKeys.favorites() })
      queryClient.removeQueries({ queryKey: queryKeys.orders() })
      queryClient.removeQueries({ queryKey: queryKeys.wallets() })
      toast.error("Sua sessão expirou. Faça login novamente para continuar.")
      navigate({ to: "/login", search: { redirect: pathnameRef.current } })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient, navigate])

  return null
}
