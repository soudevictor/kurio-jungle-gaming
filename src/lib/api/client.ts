import axios, { AxiosError } from "axios"
import type { ApiErrorBody } from "@/types/domain"
import { getStoredToken } from "@/lib/auth/storage"

export const API_BASE_URL = "/api"

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
  },
})

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`)
  }
  return config
})

export class ApiError extends Error {
  code: ApiErrorBody["error"]["code"]
  fields?: Record<string, string>
  status: number

  constructor(body: ApiErrorBody["error"], status: number) {
    super(body.message)
    this.name = "ApiError"
    this.code = body.code
    this.fields = body.fields
    this.status = status
  }
}

/** Dispatched whenever any authenticated request comes back 401 — the
 * global session listener (see `SessionExpiryWatcher`) reacts by clearing
 * the token and redirecting to /login with a `redirect` back to the current
 * page, preserving context (README §"Conta e sessão"). Skipped for the
 * `/auth/*` endpoints themselves, which report auth failures as normal
 * request outcomes rather than "your session just died".
 */
const SESSION_EXPIRED_EVENT = "kurio:session-expired"

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    if (error.response?.data?.error) {
      const isAuthEndpoint = (error.config?.url ?? "").startsWith("/auth/")
      if (error.response.status === 401 && !isAuthEndpoint) {
        window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT))
      }
      return Promise.reject(new ApiError(error.response.data.error, error.response.status))
    }
    if (error.code === "ECONNABORTED") {
      return Promise.reject(
        new ApiError({ code: "network_error", message: "Tempo de resposta excedido." }, 0),
      )
    }
    if (!error.response) {
      return Promise.reject(
        new ApiError({ code: "network_error", message: "Falha de conexão com o servidor." }, 0),
      )
    }
    return Promise.reject(
      new ApiError({ code: "server_error", message: "Erro inesperado no servidor." }, error.response.status),
    )
  },
)

export function onSessionExpired(handler: () => void) {
  window.addEventListener(SESSION_EXPIRED_EVENT, handler)
  return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handler)
}
