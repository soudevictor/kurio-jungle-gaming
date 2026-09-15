import { http, HttpResponse } from "msw"
import { compare } from "@/lib/money"
import type { Order, OrderItem } from "@/types/domain"
import { db, hashPayload } from "../db"
import { emitOrderUpdated } from "../realtime/server"
import { ScenarioNetworkError, ScenarioServerError, applyScenario, getScenario } from "../scenarios"
import { Errors, errorResponse, getSession, withScenario } from "./helpers"

interface CreateOrderBody {
  walletId?: string
  network?: string
  /** total the client last saw on screen; used to detect stale quotes */
  expectedTotalEth?: string
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Resolves a pending order to confirmed/refused after a short delay, then
 * emits `order.updated` and — only when confirmed — removes the purchased
 * quantities from the cart (README §"Pagamento e confirmação"). */
function scheduleResolution(order: Order, forcedOutcome?: "confirmed" | "refused") {
  const delay = 3000 + Math.random() * 2500
  window.setTimeout(() => {
    const current = db.getOrder(order.id)
    if (!current || current.status !== "pending") return // already resolved/reconciled
    const outcome = forcedOutcome ?? (Math.random() < 0.85 ? "confirmed" : "refused")
    const txHash = outcome === "confirmed" ? `0x${crypto.randomUUID().replace(/-/g, "")}` : null
    db.updateOrder(order.id, { status: outcome, txHash })
    if (outcome === "confirmed") {
      db.consumeCartItems(`user:${order.userId}`, order.items.map((i) => ({ nftId: i.nftId, quantity: i.quantity })))
    }
    emitOrderUpdated(order.id)
  }, delay)
}

export const orderHandlers = [
  http.post("/api/orders", async ({ request }) => {
    const session = getSession(request)
    if (!session) return Errors.unauthorized()

    // Failure-style scenarios must behave as if the request never reached
    // the server: no order is created, nothing to recover via idempotency.
    try {
      await applyScenario()
    } catch (err) {
      if (err instanceof ScenarioNetworkError) return HttpResponse.error()
      if (err instanceof ScenarioServerError) {
        return errorResponse(err.status, { code: "server_error", message: "Erro no servidor." })
      }
      throw err
    }

    const idempotencyKey = request.headers.get("idempotency-key")
    if (!idempotencyKey) return Errors.validation({ idempotencyKey: "Cabeçalho Idempotency-Key é obrigatório." })

    const body = (await request.json()) as CreateOrderBody
    if (!body.walletId || !body.network) {
      return Errors.validation({ walletId: "Selecione uma carteira e uma rede." })
    }
    const wallet = db.getWallets(session.userId).find((w) => w.id === body.walletId)
    if (!wallet) return Errors.notFound("Carteira não encontrada.")

    const cart = db.getOrCreateCart(`user:${session.userId}`)
    const hydrated = db.hydrateCartItems(cart)
    if (hydrated.items.length === 0) return Errors.conflict("Seu carrinho está vazio.")

    const requestFingerprint = {
      walletId: body.walletId,
      network: body.network,
      items: hydrated.items.map((i) => ({ nftId: i.nftId, quantity: i.quantity })),
      couponCode: cart.couponCode,
    }
    const requestHash = hashPayload(requestFingerprint)

    const existingIdempotent = db.findIdempotent(session.userId, idempotencyKey)
    if (existingIdempotent) {
      if (existingIdempotent.requestHash !== requestHash) {
        return Errors.conflict(
          "Esta chave de idempotência já foi usada com um pedido diferente.",
        )
      }
      const order = db.getOrder(existingIdempotent.orderId)
      if (!order) return Errors.server()
      return HttpResponse.json(order, { status: 200 })
    }

    const quote = db.computeQuote(cart)
    const blockingIssues = quote.issues.filter((i) => i.type !== "quantity-reduced")
    if (blockingIssues.length > 0) {
      return Errors.conflict(
        "Preço, cupom ou disponibilidade mudaram. Revise seu carrinho antes de confirmar.",
      )
    }
    if (body.expectedTotalEth && compare(body.expectedTotalEth, quote.totalEth) !== 0) {
      return Errors.conflict("O total mudou desde a última cotação. Revise antes de confirmar.")
    }

    const items: OrderItem[] = hydrated.items.map((i) => ({
      nftId: i.nftId,
      title: i.nft.title,
      coverImage: i.nft.coverImage,
      quantity: Math.min(i.quantity, i.nft.editionsAvailable),
      unitPriceEth: i.nft.priceEth,
    }))

    const order: Order = {
      id: `order-${crypto.randomUUID()}`,
      userId: session.userId,
      status: "pending",
      items,
      subtotalEth: quote.subtotalEth,
      discountEth: quote.discountEth,
      networkFeeEth: quote.networkFeeEth,
      totalEth: quote.totalEth,
      couponCode: quote.couponCode,
      walletId: wallet.id,
      network: wallet.network,
      txHash: null,
      idempotencyKey,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    }
    db.createOrder(order)
    db.storeIdempotent(session.userId, idempotencyKey, { orderId: order.id, requestHash })

    const forcedOutcome = request.headers.get("x-test-force-outcome")
    scheduleResolution(order, forcedOutcome === "confirmed" || forcedOutcome === "refused" ? forcedOutcome : undefined)

    // "slow" scenario intentionally exceeds the client's request timeout
    // *after* the order already exists server-side, so the prescribed
    // recovery path is retrying with the same Idempotency-Key.
    if (getScenario() === "slow") {
      await wait(16_000 + Math.random() * 3000)
    }

    return HttpResponse.json(order, { status: 201 })
  }),

  http.get("/api/orders/:id", async ({ request, params }) =>
    withScenario(
      async () => {
        const session = getSession(request)
        if (!session) return Errors.unauthorized()
        const order = db.getOrder(String(params.id))
        if (!order || order.userId !== session.userId) return Errors.notFound("Pedido não encontrado.")
        return HttpResponse.json(order)
      },
      { exempt: true },
    ),
  ),

  http.get("/api/orders", async ({ request }) =>
    withScenario(async () => {
      const session = getSession(request)
      if (!session) return Errors.unauthorized()
      return HttpResponse.json(db.listOrders(session.userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
    }),
  ),
]
