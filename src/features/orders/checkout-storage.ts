/**
 * Persists the in-flight checkout attempt so a refresh, a client timeout, or
 * a dropped realtime connection can all recover the same order instead of
 * creating a duplicate (README §"Pagamento e confirmação" / §7).
 */

const KEY_PREFIX = "kurio.checkout.idempotencyKey."
const PENDING_ORDER_KEY = "kurio.checkout.pendingOrderId"

export function getOrCreateIdempotencyKey(cartId: string): string {
  const storageKey = `${KEY_PREFIX}${cartId}`
  try {
    let key = localStorage.getItem(storageKey)
    if (!key) {
      key = crypto.randomUUID()
      localStorage.setItem(storageKey, key)
    }
    return key
  } catch {
    return crypto.randomUUID()
  }
}

export function clearIdempotencyKey(cartId: string) {
  try {
    localStorage.removeItem(`${KEY_PREFIX}${cartId}`)
  } catch {
    /* noop */
  }
}

export function setPendingOrderId(orderId: string) {
  try {
    localStorage.setItem(PENDING_ORDER_KEY, orderId)
  } catch {
    /* noop */
  }
}

export function getPendingOrderId(): string | null {
  try {
    return localStorage.getItem(PENDING_ORDER_KEY)
  } catch {
    return null
  }
}

export function clearPendingOrderId() {
  try {
    localStorage.removeItem(PENDING_ORDER_KEY)
  } catch {
    /* noop */
  }
}
