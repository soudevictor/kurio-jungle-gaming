import { HttpResponse } from "msw"
import type { ApiErrorBody } from "@/types/domain"
import { db } from "../db"
import { ScenarioNetworkError, ScenarioServerError, applyScenario } from "../scenarios"

export function errorResponse(status: number, error: ApiErrorBody["error"]) {
  return HttpResponse.json({ error } satisfies ApiErrorBody, { status })
}

export const Errors = {
  validation(fields: Record<string, string>, message = "Verifique os campos destacados.") {
    return errorResponse(422, { code: "validation_error", message, fields })
  },
  invalidCredentials() {
    return errorResponse(401, { code: "invalid_credentials", message: "E-mail ou senha inválidos." })
  },
  emailTaken() {
    return errorResponse(409, {
      code: "email_taken",
      message: "Este e-mail já está cadastrado.",
      fields: { email: "Este e-mail já está cadastrado." },
    })
  },
  unauthorized() {
    return errorResponse(401, { code: "unauthorized", message: "Sua sessão expirou. Faça login novamente." })
  },
  forbidden() {
    return errorResponse(403, { code: "forbidden", message: "Você não tem permissão para esta ação." })
  },
  notFound(message = "Recurso não encontrado.") {
    return errorResponse(404, { code: "not_found", message })
  },
  conflict(message: string) {
    return errorResponse(409, { code: "conflict", message })
  },
  couponInvalid() {
    return errorResponse(422, { code: "coupon_invalid", message: "Cupom inválido." })
  },
  couponExpired() {
    return errorResponse(422, { code: "coupon_expired", message: "Cupom expirado." })
  },
  server() {
    return errorResponse(500, { code: "server_error", message: "Erro inesperado. Tente novamente." })
  },
}

/** Resolves the current session from the Authorization header, if any. */
export function getSession(request: Request) {
  const auth = request.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return undefined
  const token = auth.slice("Bearer ".length)
  return db.findSession(token)
}

export function getCartId(request: Request, session: ReturnType<typeof getSession>) {
  if (session) return `user:${session.userId}`
  const guestId = request.headers.get("x-cart-id")
  return guestId ?? "guest_anonymous"
}

/**
 * Wraps a handler body with scenario latency/failure injection and turns
 * scenario errors into the same error envelope real network failures use.
 * `fn` must always resolve to a Response (use the `Errors.*` / `errorResponse`
 * helpers or `HttpResponse.json`).
 */
export async function withScenario(
  fn: () => Promise<Response> | Response,
  options?: { exempt?: boolean },
): Promise<Response> {
  try {
    await applyScenario(options)
    return await fn()
  } catch (err) {
    if (err instanceof ScenarioNetworkError) {
      // Simulates an actual network-level failure (fetch rejects), same as a
      // real dropped connection — not a JSON error body.
      return HttpResponse.error()
    }
    if (err instanceof ScenarioServerError) {
      return errorResponse(err.status, { code: "server_error", message: "Erro no servidor." })
    }
    throw err
  }
}
