import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { walletApi } from "@/lib/api/endpoints"
import { queryKeys } from "@/lib/query/keys"

export function useWallets() {
  return useQuery({
    queryKey: queryKeys.wallets(),
    queryFn: walletApi.list,
    staleTime: 30_000,
  })
}

export function useCreateWallet() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: walletApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.wallets() }),
  })
}

export function useUpdateWallet() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { id: string; patch: Parameters<typeof walletApi.update>[1] }) =>
      walletApi.update(input.id, input.patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.wallets() }),
  })
}
