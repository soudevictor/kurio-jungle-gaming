import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { nftApi } from "@/lib/api/endpoints"
import { queryKeys } from "@/lib/query/keys"
import type { NftListParams } from "@/types/domain"

export function useNftList(params: NftListParams) {
  return useQuery({
    queryKey: queryKeys.nfts(params),
    queryFn: () => nftApi.list(params),
    placeholderData: keepPreviousData,
    staleTime: 10_000,
  })
}

export function useNftDetail(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.nft(id ?? ""),
    queryFn: () => nftApi.detail(id!),
    enabled: Boolean(id),
    staleTime: 10_000,
    retry: false,
  })
}
