import type { NftListParams } from "@/types/domain"

/**
 * Centralized query key factory. Keeping every key derivation here means
 * invalidation call sites (e.g. after a mutation) can't drift from the keys
 * `useQuery` calls actually use.
 */
export const queryKeys = {
  session: () => ["session"] as const,
  nfts: (params: NftListParams) => ["nfts", params] as const,
  nft: (id: string) => ["nft", id] as const,
  favorites: () => ["favorites"] as const,
  cart: (cartId: string) => ["cart", cartId] as const,
  quote: (cartId: string) => ["quote", cartId] as const,
  order: (id: string) => ["order", id] as const,
  orders: () => ["orders"] as const,
  profile: () => ["profile"] as const,
  wallets: () => ["wallets"] as const,
}
