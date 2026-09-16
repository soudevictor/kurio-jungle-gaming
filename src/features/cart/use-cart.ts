import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/features/auth/auth-context"
import { cartApi, quoteApi } from "@/lib/api/endpoints"
import { getGuestCartId } from "@/lib/auth/storage"
import { queryKeys } from "@/lib/query/keys"
import type { Cart } from "@/types/domain"

/** Resolves to the same cart identity the mock API uses server-side:
 * `user:<id>` once authenticated, otherwise a persisted guest id. */
export function useCartId() {
  const { isAuthenticated, user } = useAuth()
  return isAuthenticated && user ? `user:${user.id}` : getGuestCartId()
}

export function useCart() {
  const cartId = useCartId()
  const queryClient = useQueryClient()
  const guestCartId = getGuestCartId()

  const cartQuery = useQuery({
    queryKey: queryKeys.cart(cartId),
    queryFn: () => cartApi.get(guestCartId),
    staleTime: 10_000,
  })

  const quoteQuery = useQuery({
    queryKey: queryKeys.quote(cartId),
    queryFn: () => quoteApi.get(guestCartId),
    enabled: (cartQuery.data?.items.length ?? 0) > 0,
    staleTime: 5_000,
  })

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: queryKeys.cart(cartId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.quote(cartId) })
  }

  const addItem = useMutation({
    mutationFn: (input: { nftId: string; quantity?: number }) => cartApi.addItem(guestCartId, input),
    onSuccess: (cart) => {
      queryClient.setQueryData(queryKeys.cart(cartId), cart)
      invalidate()
    },
  })

  const updateItem = useMutation({
    mutationFn: (input: { nftId: string; quantity: number }) =>
      cartApi.updateItem(guestCartId, input.nftId, input.quantity),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.cart(cartId) })
      const previous = queryClient.getQueryData<Cart>(queryKeys.cart(cartId))
      if (previous) {
        const next: Cart = {
          ...previous,
          items:
            input.quantity <= 0
              ? previous.items.filter((i) => i.nftId !== input.nftId)
              : previous.items.map((i) => (i.nftId === input.nftId ? { ...i, quantity: input.quantity } : i)),
        }
        queryClient.setQueryData(queryKeys.cart(cartId), next)
      }
      return { previous }
    },
    onError: (_err, _input, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.cart(cartId), context.previous)
    },
    onSettled: invalidate,
  })

  const removeItem = useMutation({
    mutationFn: (nftId: string) => cartApi.removeItem(guestCartId, nftId),
    onMutate: async (nftId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.cart(cartId) })
      const previous = queryClient.getQueryData<Cart>(queryKeys.cart(cartId))
      if (previous) {
        queryClient.setQueryData(queryKeys.cart(cartId), {
          ...previous,
          items: previous.items.filter((i) => i.nftId !== nftId),
        })
      }
      return { previous }
    },
    onError: (_err, _nftId, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.cart(cartId), context.previous)
    },
    onSettled: invalidate,
  })

  const applyCoupon = useMutation({
    mutationFn: (code: string) => cartApi.applyCoupon(guestCartId, code),
    onSuccess: (cart) => {
      queryClient.setQueryData(queryKeys.cart(cartId), cart)
      invalidate()
    },
  })

  const removeCoupon = useMutation({
    mutationFn: () => cartApi.removeCoupon(guestCartId),
    onSuccess: (cart) => {
      queryClient.setQueryData(queryKeys.cart(cartId), cart)
      invalidate()
    },
  })

  const itemCount = cartQuery.data?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0

  return {
    cartId,
    cart: cartQuery.data,
    itemCount,
    isLoading: cartQuery.isLoading,
    isError: cartQuery.isError,
    quote: quoteQuery.data,
    isQuoteLoading: quoteQuery.isLoading,
    addItem,
    updateItem,
    removeItem,
    applyCoupon,
    removeCoupon,
    refetch: () => {
      cartQuery.refetch()
      quoteQuery.refetch()
    },
  }
}
