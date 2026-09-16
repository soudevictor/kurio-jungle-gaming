/**
 * Session token + guest-cart id persistence. Kept in a tiny module instead of
 * inline `localStorage` calls so every read/write goes through one place and
 * can be swapped (e.g. for tests) without touching call sites.
 */

const TOKEN_KEY = "kurio.session.token"
const GUEST_CART_KEY = "kurio.cart.guestId"

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setStoredToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* storage unavailable (private mode) — session just won't survive refresh */
  }
}

export function getGuestCartId(): string {
  try {
    let id = localStorage.getItem(GUEST_CART_KEY)
    if (!id) {
      id = `guest_${crypto.randomUUID()}`
      localStorage.setItem(GUEST_CART_KEY, id)
    }
    return id
  } catch {
    return "guest_ephemeral"
  }
}

export function clearGuestCartId() {
  try {
    localStorage.removeItem(GUEST_CART_KEY)
  } catch {
    /* noop */
  }
}
