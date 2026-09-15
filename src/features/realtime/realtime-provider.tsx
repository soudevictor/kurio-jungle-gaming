import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef, type ReactNode } from "react"
import { toast } from "sonner"
import { useAuth } from "@/features/auth/auth-context"
import { connectRealtime, disconnectRealtime, getSocket } from "@/lib/realtime/client"
import { queryKeys } from "@/lib/query/keys"
import { SOCKET_EVENTS, type NftUpdatedEvent, type OrderUpdatedEvent } from "@/types/events"

/**
 * Bridges the mocked Socket.IO transport to the TanStack Query cache.
 *
 * Strategy: events never carry enough trust to be applied to the cache
 * directly. Each one just triggers a targeted `invalidateQueries` against the
 * REST source of truth, gated by a per-resource "last seen version" so
 * duplicate/out-of-order deliveries are no-ops (never regress newer state,
 * never re-run side effects). On (re)connect we reconcile every
 * currently-relevant resource the same way, which is also how a missed event
 * during a dropped connection gets picked back up.
 */
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const { isAuthenticated, user } = useAuth()
  const lastNftVersion = useRef(new Map<string, number>())
  const lastOrderVersion = useRef(new Map<string, number>())

  useEffect(() => {
    let cancelled = false

    function reconcile() {
      queryClient.invalidateQueries({ queryKey: ["nfts"] })
      queryClient.invalidateQueries({ queryKey: ["nft"] })
      queryClient.invalidateQueries({ queryKey: ["cart"] })
      queryClient.invalidateQueries({ queryKey: ["quote"] })
      if (isAuthenticated) {
        queryClient.invalidateQueries({ queryKey: queryKeys.favorites() })
        queryClient.invalidateQueries({ queryKey: queryKeys.orders() })
      }
    }

    function onNftUpdated(event: NftUpdatedEvent) {
      const seen = lastNftVersion.current.get(event.nftId) ?? 0
      if (event.version <= seen) return // duplicate or out-of-order — ignore
      lastNftVersion.current.set(event.nftId, event.version)

      queryClient.invalidateQueries({ queryKey: queryKeys.nft(event.nftId) })
      queryClient.invalidateQueries({ queryKey: ["nfts"] })
      queryClient.invalidateQueries({ queryKey: ["cart"] })
      queryClient.invalidateQueries({ queryKey: ["quote"] })

      const cartMatch = queryClient
        .getQueriesData<{ items?: Array<{ nftId: string; nft: { title: string } }> }>({ queryKey: ["cart"] })
        .some(([, cart]) => cart?.items?.some((i) => i.nftId === event.nftId))
      if (cartMatch) {
        toast.info("Um item do seu carrinho foi atualizado", {
          description: "Preço ou disponibilidade mudou. Revise o resumo antes de continuar.",
        })
      }
    }

    function onOrderUpdated(event: OrderUpdatedEvent) {
      // Never let another session's order events touch this user's cache.
      if (user && event.userId !== user.id) return
      const seen = lastOrderVersion.current.get(event.orderId) ?? 0
      if (event.version <= seen) return
      lastOrderVersion.current.set(event.orderId, event.version)

      queryClient.invalidateQueries({ queryKey: queryKeys.order(event.orderId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.orders() })

      if (event.status === "confirmed") {
        // Purchased quantities were just removed from the cart server-side.
        queryClient.invalidateQueries({ queryKey: ["cart"] })
        queryClient.invalidateQueries({ queryKey: ["quote"] })
        toast.success("Pedido confirmado!")
      } else if (event.status === "refused") {
        toast.error("Pagamento recusado")
      }
    }

    getSocket().then((socket) => {
      if (cancelled) return
      socket.on("connect", reconcile)
      socket.on(SOCKET_EVENTS.nftUpdated, onNftUpdated)
      socket.on(SOCKET_EVENTS.orderUpdated, onOrderUpdated)
      connectRealtime()
    })

    return () => {
      cancelled = true
      getSocket().then((socket) => {
        socket.off("connect", reconcile)
        socket.off(SOCKET_EVENTS.nftUpdated, onNftUpdated)
        socket.off(SOCKET_EVENTS.orderUpdated, onOrderUpdated)
      })
      disconnectRealtime()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient, isAuthenticated, user?.id])

  // Drop any state scoped to the previous session on logout so no listener
  // keeps a reference to another user's data.
  useEffect(() => {
    if (!isAuthenticated) {
      lastOrderVersion.current.clear()
    }
  }, [isAuthenticated])

  return <>{children}</>
}
