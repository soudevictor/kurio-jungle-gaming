import type { OrderStatus } from "./domain"

/**
 * Realtime event contracts (Socket.IO). Every event carries a stable id, the
 * affected resource id and a monotonically increasing `version` so clients
 * can discard duplicates/out-of-order deliveries without reapplying effects.
 */

export interface NftUpdatedEvent {
  eventId: string
  nftId: string
  version: number
  priceEth: string
  editionsAvailable: number
  updatedAt: string
}

export interface OrderUpdatedEvent {
  eventId: string
  orderId: string
  userId: string
  version: number
  status: OrderStatus
  updatedAt: string
}

export const SOCKET_EVENTS = {
  nftUpdated: "nft.updated",
  orderUpdated: "order.updated",
  identify: "identify",
} as const
