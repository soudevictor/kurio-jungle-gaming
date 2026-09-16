import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRef } from "react"
import { ApiError } from "@/lib/api/client"
import { orderApi } from "@/lib/api/endpoints"
import { queryKeys } from "@/lib/query/keys"
import type { Order } from "@/types/domain"
import { useCartId } from "@/features/cart/use-cart"
import {
  clearIdempotencyKey,
  clearPendingOrderId,
  getOrCreateIdempotencyKey,
  setPendingOrderId,
} from "./checkout-storage"

/** Polls a pending order until it reaches a terminal state, as a safety net
 * alongside the socket.io `order.updated` push (covers a missed/late event). */
export function useOrder(orderId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.order(orderId ?? ""),
    queryFn: () => orderApi.get(orderId!),
    enabled: Boolean(orderId),
    refetchInterval: (query) => (query.state.data?.status === "pending" ? 4000 : false),
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()
  const cartId = useCartId()
  const idempotencyKeyRef = useRef<string | null>(null)

  const mutation = useMutation({
    mutationFn: async (input: { walletId: string; network: string; expectedTotalEth: string }) => {
      const key = idempotencyKeyRef.current ?? getOrCreateIdempotencyKey(cartId)
      idempotencyKeyRef.current = key
      try {
        return await orderApi.create(input, key)
      } catch (err) {
        // A network/timeout failure does NOT mean the order wasn't created —
        // the same idempotency key will recover it on the next attempt.
        if (err instanceof ApiError && err.code === "network_error") {
          throw err
        }
        // Any other rejection (validation, stale quote, conflict) means this
        // attempt is done; a genuinely new attempt needs a fresh key.
        idempotencyKeyRef.current = null
        clearIdempotencyKey(cartId)
        throw err
      }
    },
    onSuccess: (order: Order) => {
      setPendingOrderId(order.id)
      queryClient.setQueryData(queryKeys.order(order.id), order)
      if (order.status !== "pending") {
        idempotencyKeyRef.current = null
        clearIdempotencyKey(cartId)
        clearPendingOrderId()
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.cart(cartId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.quote(cartId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.orders() })
    },
  })

  return mutation
}
