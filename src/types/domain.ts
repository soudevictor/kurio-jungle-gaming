/**
 * Domain contracts shared between the mocked REST layer (MSW), the API
 * client (Axios) and the UI. Kept framework-agnostic on purpose so they can
 * be reused by handlers, hooks and Playwright fixtures alike.
 *
 * ETH amounts always travel as decimal strings (never `number`) to avoid
 * floating point drift. Arithmetic on them goes through `src/lib/money.ts`.
 */

export type ID = string

export interface Creator {
  id: ID
  name: string
  handle: string
  avatarUrl: string
  verified: boolean
}

export type NftCategory =
  | "art"
  | "photography"
  | "music"
  | "3d"
  | "collectibles"
  | "generative"
  | "gaming"
  | "subscriptions"
  | "utility"
  | "sports"

export interface NftAttribute {
  trait: string
  value: string
}

export interface Nft {
  id: ID
  slug: string
  title: string
  description: string
  category: NftCategory
  tags: string[]
  creator: Creator
  collection: string
  images: string[]
  coverImage: string
  priceEth: string
  lastSalePriceEth: string | null
  editionsTotal: number
  editionsAvailable: number
  likes: number
  trending: boolean
  isNew: boolean
  attributes: NftAttribute[]
  createdAt: string
  /** bumped by the mock realtime layer whenever price/availability changes */
  version: number
}

export interface NftListParams {
  search?: string
  category?: NftCategory | "all"
  sort?: "relevance" | "price-asc" | "price-desc" | "recent" | "trending"
  minPrice?: string
  maxPrice?: string
  page?: number
  pageSize?: number
}

export interface Paginated<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface NftListResult extends Paginated<Nft> {
  /** counts per category among results matching `search` only (ignores the
   * active category filter itself, so the sidebar can show "how many if I
   * switch"), used to render facet counts in the catalog sidebar. */
  categoryCounts: Record<NftCategory, number>
}

export interface User {
  id: ID
  name: string
  email: string
  avatarUrl: string | null
  bio: string | null
  createdAt: string
}

export interface Session {
  user: User
  token: string
  expiresAt: string
}

export type Network = "ethereum" | "polygon" | "base"

export interface Wallet {
  id: ID
  label: string
  address: string
  network: Network
  isPrimary: boolean
  createdAt: string
}

export interface CartItem {
  id: ID
  nftId: ID
  quantity: number
  /** denormalized snapshot for display; source of truth is the live NFT */
  nft: Nft
}

export interface Cart {
  id: ID
  items: CartItem[]
  couponCode: string | null
}

export interface QuoteIssue {
  nftId: ID
  type: "price-changed" | "unavailable" | "quantity-reduced" | "coupon-invalid"
  message: string
  previousPriceEth?: string
  currentPriceEth?: string
  availableEditions?: number
}

export interface Quote {
  subtotalEth: string
  discountEth: string
  networkFeeEth: string
  totalEth: string
  couponCode: string | null
  couponValid: boolean
  issues: QuoteIssue[]
  /** monotonically increasing, used to detect stale quotes at checkout time */
  version: number
  generatedAt: string
}

export type OrderStatus = "pending" | "confirmed" | "refused"

export interface OrderItem {
  nftId: ID
  title: string
  coverImage: string
  quantity: number
  unitPriceEth: string
}

export interface Order {
  id: ID
  userId: ID
  status: OrderStatus
  items: OrderItem[]
  subtotalEth: string
  discountEth: string
  networkFeeEth: string
  totalEth: string
  couponCode: string | null
  walletId: ID
  network: Network
  txHash: string | null
  idempotencyKey: string
  createdAt: string
  updatedAt: string
  version: number
}

export interface ApiErrorBody {
  error: {
    code:
      | "validation_error"
      | "invalid_credentials"
      | "email_taken"
      | "unauthorized"
      | "forbidden"
      | "not_found"
      | "conflict"
      | "coupon_invalid"
      | "coupon_expired"
      | "price_changed"
      | "unavailable"
      | "idempotency_conflict"
      | "network_error"
      | "server_error"
    message: string
    fields?: Record<string, string>
  }
}
