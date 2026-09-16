import { toSocketIo } from "@mswjs/socket.io-binding"
import { ws } from "msw"
import { SOCKET_EVENTS, type NftUpdatedEvent, type OrderUpdatedEvent } from "@/types/events"
import { db } from "../db"
import { SCRIPTED_DRIFT_NFT_ID } from "../data/fixtures"

/**
 * Mocked Socket.IO server. Transport: the browser's native WebSocket,
 * intercepted by `@mswjs/interceptors` and decoded/encoded as the Socket.IO
 * wire protocol via `@mswjs/socket.io-binding` (see README §6). The
 * socket.io-client is configured with `transports: ["websocket"]` (see
 * `src/lib/realtime/client.ts`) so it never falls back to HTTP long-polling,
 * which this binding does not intercept.
 *
 * Limitation documented here (also in ARCHITECTURE.md): the binding does not
 * implement Socket.IO rooms/namespaces, so "broadcast to a room" is done by
 * hand — tracking connected clients in `connections` and filtering by userId
 * client-side for user-scoped events (`order.updated`).
 */

type ClientHandle = ReturnType<typeof toSocketIo>["client"]

const connections = new Set<ClientHandle>()

function socketOrigin() {
  const isHttps = window.location.protocol === "https:"
  return `${isHttps ? "wss" : "ws"}://${window.location.host}`
}

export function registerSocketServer() {
  // MSW's WebSocketHandler strips a leading "/socket.io/" from the incoming
  // URL before matching (it assumes exactly this convention), so the link
  // pattern must NOT repeat that segment — just the origin.
  const link = ws.link(socketOrigin())

  return link.addEventListener("connection", (connection) => {
    const io = toSocketIo(connection)
    connections.add(io.client)

    connection.client.addEventListener("close", () => {
      connections.delete(io.client)
    })
  })
}

function broadcast(event: string, payload: unknown) {
  for (const client of connections) {
    client.emit(event, payload)
  }
}

export function emitNftUpdated(nftId: string) {
  const nft = db.getNft(nftId)
  if (!nft) return
  const payload: NftUpdatedEvent = {
    eventId: crypto.randomUUID(),
    nftId: nft.id,
    version: nft.version,
    priceEth: nft.priceEth,
    editionsAvailable: nft.editionsAvailable,
    updatedAt: new Date().toISOString(),
  }
  broadcast(SOCKET_EVENTS.nftUpdated, payload)
}

export function emitOrderUpdated(orderId: string) {
  const order = db.getOrder(orderId)
  if (!order) return
  const payload: OrderUpdatedEvent = {
    eventId: crypto.randomUUID(),
    orderId: order.id,
    userId: order.userId,
    version: order.version,
    status: order.status,
    updatedAt: order.updatedAt,
  }
  broadcast(SOCKET_EVENTS.orderUpdated, payload)
}

// ---------------------------------------------------------------------------
// Background drift: keeps the realtime story alive without user action, and
// guarantees at least one deterministic, reliably-reproducible price change
// on `SCRIPTED_DRIFT_NFT_ID` shortly after boot so the required scenario
// ("NFT no carrinho tem o preço alterado durante a navegação") is easy to
// trigger manually and to assert on in Playwright.
// ---------------------------------------------------------------------------

// Test-only hook so Playwright can trigger a deterministic price/availability
// change instantly instead of waiting on the scripted 16s drift. No
// production code path calls this.
if (typeof window !== "undefined") {
  ;(window as unknown as { __kurioForceNftUpdate?: (id: string, patch: { priceEth?: string; editionsAvailable?: number }) => void }).__kurioForceNftUpdate = (
    id,
    patch,
  ) => {
    db.mutateNft(id, patch)
    emitNftUpdated(id)
  }
}

// Keeps the random walk from compounding into an absurd number over a
// long-running demo/dev session — bounded to roughly the seed price range.
function clampPrice(value: number): number {
  return Math.min(6, Math.max(0.01, value))
}

let driftStarted = false

export function startMarketDrift() {
  if (driftStarted) return
  driftStarted = true

  window.setTimeout(() => {
    const nft = db.getNft(SCRIPTED_DRIFT_NFT_ID)
    if (nft) {
      const bumped = clampPrice(Number.parseFloat(nft.priceEth) * 1.12).toFixed(3)
      db.mutateNft(nft.id, { priceEth: bumped })
      emitNftUpdated(nft.id)
    }
  }, 16_000)

  window.setInterval(() => {
    const all = db.listNfts()
    const target = all[Math.floor(Math.random() * all.length)]
    if (!target) return
    const drift = 1 + (Math.random() - 0.5) * 0.1
    const nextPrice = clampPrice(Number.parseFloat(target.priceEth) * drift).toFixed(3)
    const nextAvailable = Math.random() < 0.15
      ? Math.max(0, target.editionsAvailable - 1)
      : target.editionsAvailable
    db.mutateNft(target.id, { priceEth: nextPrice, editionsAvailable: nextAvailable })
    emitNftUpdated(target.id)
  }, 25_000)
}
