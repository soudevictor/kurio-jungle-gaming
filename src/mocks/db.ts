import { add, multiply, subtract } from "@/lib/money"
import type { Cart, CartItem, Nft, Order, Quote, QuoteIssue, Wallet } from "@/types/domain"
import {
  COUPONS,
  FIXTURE_PASSWORD,
  NETWORK_FEE_ETH,
  NFTS,
  USERS,
  WALLETS,
  WALLETS_BY_USER,
  type FixtureUser,
} from "./data/fixtures"
import { hashString } from "./data/rng"

const STORAGE_KEY = "kurio.mock.db.v2"

interface Session {
  token: string
  userId: string
  expiresAt: string
}

interface IdempotencyRecord {
  requestHash: number
  orderId: string
}

interface SerializedState {
  nfts: Nft[]
  favorites: Record<string, string[]>
  carts: Record<string, Cart>
  orders: Order[]
  wallets: Record<string, Wallet[]>
  sessions: Session[]
  idempotency: Record<string, IdempotencyRecord>
  users: FixtureUser[]
}

function freshState(): SerializedState {
  return {
    nfts: NFTS.map((n) => ({ ...n })),
    favorites: {},
    carts: {},
    orders: [],
    wallets: Object.fromEntries(
      Object.entries(WALLETS_BY_USER).map(([userId, ids]) => [
        userId,
        ids.map((id) => ({ ...WALLETS.find((w) => w.id === id)! })),
      ]),
    ),
    sessions: [],
    idempotency: {},
    users: USERS.map((u) => ({ ...u })),
  }
}

function loadState(): SerializedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as SerializedState
  } catch {
    /* corrupted storage — fall back to fresh fixtures */
  }
  return freshState()
}

class MockDatabase {
  state: SerializedState = loadState()

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state))
    } catch {
      /* storage unavailable — mutations just won't survive refresh */
    }
  }

  reset() {
    this.state = freshState()
    this.persist()
  }

  // --- Users / auth -----------------------------------------------------

  findUserByEmail(email: string) {
    return this.state.users.find((u) => u.email.toLowerCase() === email.toLowerCase())
  }

  findUserById(id: string) {
    return this.state.users.find((u) => u.id === id)
  }

  emailTaken(email: string) {
    return this.state.users.some((u) => u.email.toLowerCase() === email.toLowerCase())
  }

  createUser(input: { name: string; email: string; password: string }) {
    const user: FixtureUser = {
      id: `user-${crypto.randomUUID()}`,
      name: input.name,
      email: input.email,
      password: input.password || FIXTURE_PASSWORD,
      avatarUrl: null,
      bio: null,
      createdAt: new Date().toISOString(),
    }
    this.state.users.push(user)
    this.state.wallets[user.id] = []
    this.persist()
    return user
  }

  updateUser(id: string, patch: Partial<FixtureUser>) {
    const user = this.findUserById(id)
    if (!user) return undefined
    Object.assign(user, patch)
    this.persist()
    return user
  }

  createSession(userId: string): Session {
    const session: Session = {
      token: crypto.randomUUID(),
      userId,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString(),
    }
    this.state.sessions.push(session)
    this.persist()
    return session
  }

  findSession(token: string): Session | undefined {
    const session = this.state.sessions.find((s) => s.token === token)
    if (!session) return undefined
    if (new Date(session.expiresAt).getTime() < Date.now()) return undefined
    return session
  }

  destroySession(token: string) {
    this.state.sessions = this.state.sessions.filter((s) => s.token !== token)
    this.persist()
  }

  // --- NFTs ---------------------------------------------------------------

  listNfts() {
    return this.state.nfts
  }

  getNft(id: string) {
    return this.state.nfts.find((n) => n.id === id)
  }

  /** Mutates price/availability and bumps version; used by realtime drift + tests. */
  mutateNft(id: string, patch: Partial<Pick<Nft, "priceEth" | "editionsAvailable">>) {
    const nft = this.getNft(id)
    if (!nft) return undefined
    Object.assign(nft, patch)
    nft.version += 1
    this.persist()
    return nft
  }

  // --- Favorites ------------------------------------------------------------

  getFavorites(userId: string): string[] {
    return this.state.favorites[userId] ?? []
  }

  addFavorite(userId: string, nftId: string) {
    const list = new Set(this.getFavorites(userId))
    list.add(nftId)
    this.state.favorites[userId] = [...list]
    this.persist()
  }

  removeFavorite(userId: string, nftId: string) {
    this.state.favorites[userId] = this.getFavorites(userId).filter((id) => id !== nftId)
    this.persist()
  }

  // --- Carts ----------------------------------------------------------------

  getOrCreateCart(cartId: string): Cart {
    let cart = this.state.carts[cartId]
    if (!cart) {
      cart = { id: cartId, items: [], couponCode: null }
      this.state.carts[cartId] = cart
      this.persist()
    }
    return cart
  }

  saveCart(cart: Cart) {
    this.state.carts[cart.id] = cart
    this.persist()
  }

  /** Merges guest cart items into the user cart on login, then drops the guest cart. */
  mergeCarts(guestCartId: string, userCartId: string) {
    const guest = this.state.carts[guestCartId]
    if (!guest || guest.items.length === 0) return this.getOrCreateCart(userCartId)
    const target = this.getOrCreateCart(userCartId)
    for (const item of guest.items) {
      const existing = target.items.find((i) => i.nftId === item.nftId)
      if (existing) existing.quantity += item.quantity
      else target.items.push({ ...item, id: crypto.randomUUID() })
    }
    delete this.state.carts[guestCartId]
    this.persist()
    return target
  }

  hydrateCartItems(cart: Cart): Cart {
    // Re-attach live NFT snapshots so price/availability changes are always
    // reflected without needing to duplicate mutation logic.
    const items: CartItem[] = cart.items
      .map((item) => {
        const nft = this.getNft(item.nftId)
        if (!nft) return null
        return { ...item, nft }
      })
      .filter((i): i is CartItem => i !== null)
    return { ...cart, items }
  }

  // --- Quote ------------------------------------------------------------

  computeQuote(cart: Cart): Quote {
    const hydrated = this.hydrateCartItems(cart)
    const issues: QuoteIssue[] = []
    let subtotal = "0"

    for (const item of hydrated.items) {
      if (item.nft.editionsAvailable <= 0) {
        issues.push({
          nftId: item.nft.id,
          type: "unavailable",
          message: `${item.nft.title} está esgotado.`,
        })
        continue
      }
      if (item.quantity > item.nft.editionsAvailable) {
        issues.push({
          nftId: item.nft.id,
          type: "quantity-reduced",
          message: `Apenas ${item.nft.editionsAvailable} unidade(s) disponível(is) de ${item.nft.title}.`,
          availableEditions: item.nft.editionsAvailable,
        })
      }
      const quantity = Math.min(item.quantity, item.nft.editionsAvailable)
      subtotal = add(subtotal, multiply(item.nft.priceEth, quantity))
    }

    let discount = "0"
    let couponValid = false
    const couponCode = cart.couponCode
    if (couponCode) {
      const coupon = COUPONS.find((c) => c.code.toLowerCase() === couponCode.toLowerCase())
      if (!coupon) {
        issues.push({ nftId: "", type: "coupon-invalid", message: "Cupom inválido." })
      } else if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()) {
        issues.push({ nftId: "", type: "coupon-invalid", message: "Cupom expirado." })
      } else {
        couponValid = true
        discount =
          coupon.kind === "percentage" ? multiply(subtotal, coupon.value / 100) : coupon.value.toFixed(18)
      }
    }

    const networkFee = hydrated.items.length > 0 ? NETWORK_FEE_ETH : "0"
    const afterDiscount = subtract(subtotal, discount)
    const total = add(afterDiscount, networkFee)

    return {
      subtotalEth: subtotal,
      discountEth: discount,
      networkFeeEth: networkFee,
      totalEth: total,
      couponCode,
      couponValid,
      issues,
      version: Date.now(),
      generatedAt: new Date().toISOString(),
    }
  }

  // --- Wallets ------------------------------------------------------------

  getWallets(userId: string): Wallet[] {
    return this.state.wallets[userId] ?? []
  }

  upsertWallet(userId: string, wallet: Wallet) {
    const list = this.getWallets(userId)
    const idx = list.findIndex((w) => w.id === wallet.id)
    if (wallet.isPrimary) {
      for (const w of list) w.isPrimary = false
    }
    if (idx >= 0) list[idx] = wallet
    else list.push(wallet)
    this.state.wallets[userId] = list
    this.persist()
    return wallet
  }

  // --- Orders ---------------------------------------------------------------

  findIdempotent(userId: string, key: string): IdempotencyRecord | undefined {
    return this.state.idempotency[`${userId}:${key}`]
  }

  storeIdempotent(userId: string, key: string, record: IdempotencyRecord) {
    this.state.idempotency[`${userId}:${key}`] = record
    this.persist()
  }

  createOrder(order: Order) {
    this.state.orders.push(order)
    this.persist()
    return order
  }

  getOrder(id: string) {
    return this.state.orders.find((o) => o.id === id)
  }

  listOrders(userId: string) {
    return this.state.orders.filter((o) => o.userId === userId)
  }

  updateOrder(id: string, patch: Partial<Order>) {
    const order = this.getOrder(id)
    if (!order) return undefined
    Object.assign(order, patch, { version: order.version + 1, updatedAt: new Date().toISOString() })
    this.persist()
    return order
  }

  /** Removes purchased quantities from the cart after an order is confirmed. */
  consumeCartItems(cartId: string, purchased: Array<{ nftId: string; quantity: number }>) {
    const cart = this.state.carts[cartId]
    if (!cart) return
    for (const p of purchased) {
      const item = cart.items.find((i) => i.nftId === p.nftId)
      if (!item) continue
      item.quantity -= p.quantity
    }
    cart.items = cart.items.filter((i) => i.quantity > 0)
    cart.couponCode = null
    this.persist()
  }
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`
  const keys = Object.keys(value as Record<string, unknown>).sort()
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify((value as Record<string, unknown>)[k])}`).join(",")}}`
}

export function hashPayload(payload: unknown): number {
  return hashString(stableStringify(payload))
}

export const db = new MockDatabase()

// Exposed for manual QA / Playwright fixtures: `window.__kurioMockReset()`.
if (typeof window !== "undefined") {
  ;(window as unknown as { __kurioMockReset?: () => void }).__kurioMockReset = () => db.reset()
}
