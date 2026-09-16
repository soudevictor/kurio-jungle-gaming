import type {
  Cart,
  Nft,
  NftListParams,
  NftListResult,
  Order,
  Quote,
  Session,
  User,
  Wallet,
} from "@/types/domain"
import { apiClient } from "./client"

function toSearchParams(params: NftListParams): URLSearchParams {
  const sp = new URLSearchParams()
  if (params.search) sp.set("search", params.search)
  if (params.category && params.category !== "all") sp.set("category", params.category)
  if (params.sort) sp.set("sort", params.sort)
  if (params.minPrice) sp.set("minPrice", params.minPrice)
  if (params.maxPrice) sp.set("maxPrice", params.maxPrice)
  sp.set("page", String(params.page ?? 1))
  sp.set("pageSize", String(params.pageSize ?? 12))
  return sp
}

export const authApi = {
  register: (input: { name: string; email: string; password: string }) =>
    apiClient.post<Session>("/auth/register", input).then((r) => r.data),
  login: (input: { email: string; password: string }) =>
    apiClient.post<Session>("/auth/login", input).then((r) => r.data),
  session: () => apiClient.get<Session>("/auth/session").then((r) => r.data),
  logout: () => apiClient.post("/auth/logout").then(() => undefined),
}

export const nftApi = {
  list: (params: NftListParams) =>
    apiClient.get<NftListResult>(`/nfts?${toSearchParams(params).toString()}`).then((r) => r.data),
  detail: (id: string) => apiClient.get<Nft>(`/nfts/${id}`).then((r) => r.data),
}

export const favoriteApi = {
  list: () => apiClient.get<Nft[]>("/favorites").then((r) => r.data),
  add: (nftId: string) => apiClient.post("/favorites", { nftId }).then(() => undefined),
  remove: (nftId: string) => apiClient.delete(`/favorites/${nftId}`).then(() => undefined),
}

function cartHeaders(guestCartId: string) {
  return { headers: { "X-Cart-Id": guestCartId } }
}

export const cartApi = {
  get: (guestCartId: string) => apiClient.get<Cart>("/cart", cartHeaders(guestCartId)).then((r) => r.data),
  addItem: (guestCartId: string, input: { nftId: string; quantity?: number }) =>
    apiClient.post<Cart>("/cart/items", input, cartHeaders(guestCartId)).then((r) => r.data),
  updateItem: (guestCartId: string, nftId: string, quantity: number) =>
    apiClient.patch<Cart>(`/cart/items/${nftId}`, { quantity }, cartHeaders(guestCartId)).then((r) => r.data),
  removeItem: (guestCartId: string, nftId: string) =>
    apiClient.delete<Cart>(`/cart/items/${nftId}`, cartHeaders(guestCartId)).then((r) => r.data),
  applyCoupon: (guestCartId: string, code: string) =>
    apiClient.post<Cart>("/cart/coupon", { code }, cartHeaders(guestCartId)).then((r) => r.data),
  removeCoupon: (guestCartId: string) =>
    apiClient.delete<Cart>("/cart/coupon", cartHeaders(guestCartId)).then((r) => r.data),
  merge: (guestCartId: string) => apiClient.post<Cart>("/cart/merge", { guestCartId }).then((r) => r.data),
}

export const quoteApi = {
  get: (guestCartId: string) => apiClient.get<Quote>("/quote", cartHeaders(guestCartId)).then((r) => r.data),
}

export const orderApi = {
  create: (
    input: { walletId: string; network: string; expectedTotalEth: string },
    idempotencyKey: string,
  ) =>
    apiClient
      .post<Order>("/orders", input, { headers: { "Idempotency-Key": idempotencyKey } })
      .then((r) => r.data),
  get: (id: string) => apiClient.get<Order>(`/orders/${id}`).then((r) => r.data),
  list: () => apiClient.get<Order[]>("/orders").then((r) => r.data),
}

export const profileApi = {
  get: () => apiClient.get<User>("/profile").then((r) => r.data),
  update: (input: { name?: string; bio?: string; avatarUrl?: string }) =>
    apiClient.patch<User>("/profile", input).then((r) => r.data),
  changePassword: (input: { currentPassword: string; newPassword: string }) =>
    apiClient.post("/profile/password", input).then(() => undefined),
}

export const walletApi = {
  list: () => apiClient.get<Wallet[]>("/wallets").then((r) => r.data),
  create: (input: { label: string; address: string; network: string; isPrimary?: boolean }) =>
    apiClient.post<Wallet>("/wallets", input).then((r) => r.data),
  update: (id: string, input: Partial<{ label: string; address: string; network: string; isPrimary: boolean }>) =>
    apiClient.patch<Wallet>(`/wallets/${id}`, input).then((r) => r.data),
}
