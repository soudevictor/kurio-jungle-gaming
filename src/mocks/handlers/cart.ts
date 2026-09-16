import { http, HttpResponse } from "msw"
import { db } from "../db"
import { Errors, getCartId, getSession, withScenario } from "./helpers"

export const cartHandlers = [
  http.get("/api/cart", async ({ request }) =>
    withScenario(async () => {
      const session = getSession(request)
      const cartId = getCartId(request, session)
      const cart = db.getOrCreateCart(cartId)
      return HttpResponse.json(db.hydrateCartItems(cart))
    }),
  ),

  http.post("/api/cart/items", async ({ request }) =>
    withScenario(async () => {
      const session = getSession(request)
      const cartId = getCartId(request, session)
      const body = (await request.json()) as { nftId?: string; quantity?: number }
      if (!body.nftId) return Errors.validation({ nftId: "NFT inválido." })
      const nft = db.getNft(body.nftId)
      if (!nft) return Errors.notFound("NFT não encontrado.")
      const quantity = Math.max(1, Math.trunc(body.quantity ?? 1))

      const cart = db.getOrCreateCart(cartId)
      const existing = cart.items.find((i) => i.nftId === body.nftId)
      const nextQuantity = (existing?.quantity ?? 0) + quantity
      if (nextQuantity > nft.editionsAvailable) {
        return Errors.conflict(`Apenas ${nft.editionsAvailable} unidade(s) disponível(is) de ${nft.title}.`)
      }
      if (existing) existing.quantity = nextQuantity
      else cart.items.push({ id: crypto.randomUUID(), nftId: nft.id, quantity, nft })
      db.saveCart(cart)
      return HttpResponse.json(db.hydrateCartItems(cart), { status: 201 })
    }),
  ),

  http.patch("/api/cart/items/:nftId", async ({ request, params }) =>
    withScenario(async () => {
      const session = getSession(request)
      const cartId = getCartId(request, session)
      const body = (await request.json()) as { quantity?: number }
      const nft = db.getNft(String(params.nftId))
      if (!nft) return Errors.notFound("NFT não encontrado.")
      const quantity = Math.trunc(body.quantity ?? 0)

      const cart = db.getOrCreateCart(cartId)
      const item = cart.items.find((i) => i.nftId === params.nftId)
      if (!item) return Errors.notFound("Item não está no carrinho.")
      if (quantity <= 0) {
        cart.items = cart.items.filter((i) => i.nftId !== params.nftId)
      } else {
        if (quantity > nft.editionsAvailable) {
          return Errors.conflict(`Apenas ${nft.editionsAvailable} unidade(s) disponível(is) de ${nft.title}.`)
        }
        item.quantity = quantity
      }
      db.saveCart(cart)
      return HttpResponse.json(db.hydrateCartItems(cart))
    }),
  ),

  http.delete("/api/cart/items/:nftId", async ({ request, params }) =>
    withScenario(async () => {
      const session = getSession(request)
      const cartId = getCartId(request, session)
      const cart = db.getOrCreateCart(cartId)
      cart.items = cart.items.filter((i) => i.nftId !== params.nftId)
      db.saveCart(cart)
      return HttpResponse.json(db.hydrateCartItems(cart))
    }),
  ),

  http.post("/api/cart/coupon", async ({ request }) =>
    withScenario(async () => {
      const session = getSession(request)
      const cartId = getCartId(request, session)
      const body = (await request.json()) as { code?: string }
      if (!body.code) return Errors.validation({ code: "Informe um cupom." })
      const cart = db.getOrCreateCart(cartId)
      cart.couponCode = body.code.trim().toUpperCase()
      db.saveCart(cart)
      const quote = db.computeQuote(cart)
      if (!quote.couponValid) {
        const issue = quote.issues.find((i) => i.type === "coupon-invalid")
        cart.couponCode = null
        db.saveCart(cart)
        return issue?.message === "Cupom expirado." ? Errors.couponExpired() : Errors.couponInvalid()
      }
      return HttpResponse.json(db.hydrateCartItems(cart))
    }),
  ),

  http.delete("/api/cart/coupon", async ({ request }) =>
    withScenario(async () => {
      const session = getSession(request)
      const cartId = getCartId(request, session)
      const cart = db.getOrCreateCart(cartId)
      cart.couponCode = null
      db.saveCart(cart)
      return HttpResponse.json(db.hydrateCartItems(cart))
    }),
  ),

  http.post("/api/cart/merge", async ({ request }) =>
    withScenario(async () => {
      const session = getSession(request)
      if (!session) return Errors.unauthorized()
      const body = (await request.json()) as { guestCartId?: string }
      if (!body.guestCartId) return Errors.validation({ guestCartId: "Carrinho de visitante inválido." })
      const merged = db.mergeCarts(body.guestCartId, `user:${session.userId}`)
      return HttpResponse.json(db.hydrateCartItems(merged))
    }),
  ),

  http.get("/api/quote", async ({ request }) =>
    withScenario(async () => {
      const session = getSession(request)
      const cartId = getCartId(request, session)
      const cart = db.getOrCreateCart(cartId)
      return HttpResponse.json(db.computeQuote(cart))
    }),
  ),
]
