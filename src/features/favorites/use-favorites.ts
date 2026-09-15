import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/features/auth/auth-context"
import { favoriteApi } from "@/lib/api/endpoints"
import { queryKeys } from "@/lib/query/keys"
import type { Nft } from "@/types/domain"

export function useFavorites() {
  const { isAuthenticated } = useAuth()
  const queryClient = useQueryClient()

  const favoritesQuery = useQuery({
    queryKey: queryKeys.favorites(),
    queryFn: favoriteApi.list,
    enabled: isAuthenticated,
    staleTime: 30_000,
  })

  const favoriteIds = new Set((favoritesQuery.data ?? []).map((n) => n.id))

  /** Optimistic toggle with rollback on failure (README §4). */
  const toggle = useMutation({
    mutationFn: async (nft: Nft) => {
      if (favoriteIds.has(nft.id)) await favoriteApi.remove(nft.id)
      else await favoriteApi.add(nft.id)
    },
    onMutate: async (nft) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.favorites() })
      const previous = queryClient.getQueryData<Nft[]>(queryKeys.favorites())
      const isFavorited = (previous ?? []).some((n) => n.id === nft.id)
      queryClient.setQueryData<Nft[]>(queryKeys.favorites(), (old) => {
        const list = old ?? []
        return isFavorited ? list.filter((n) => n.id !== nft.id) : [...list, nft]
      })
      return { previous }
    },
    onError: (_err, _nft, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.favorites(), context.previous)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.favorites() }),
  })

  return {
    favorites: favoritesQuery.data ?? [],
    favoriteIds,
    isLoading: favoritesQuery.isLoading,
    toggle: toggle.mutate,
    isToggling: toggle.isPending,
  }
}
