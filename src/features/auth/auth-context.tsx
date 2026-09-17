import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createContext, useContext, useMemo, useState, type ReactNode } from "react"
import { ApiError } from "@/lib/api/client"
import { authApi, cartApi } from "@/lib/api/endpoints"
import { queryKeys } from "@/lib/query/keys"
import { getGuestCartId, setStoredToken } from "@/lib/auth/storage"
import type { ApiErrorBody, Session, User } from "@/types/domain"

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  /** true only while the very first session check is in flight (no cached user yet) */
  isBootstrapping: boolean
  login: (input: { email: string; password: string }) => Promise<Session>
  loginError: ApiErrorBody["error"] | null
  isLoggingIn: boolean
  register: (input: { name: string; email: string; password: string }) => Promise<Session>
  registerError: ApiErrorBody["error"] | null
  isRegistering: boolean
  logout: () => Promise<void>
  authModalOpen: boolean
  authModalTab: "login" | "signup"
  openAuthModal: (tab: "login" | "signup") => void
  closeAuthModal: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function toErrorBody(error: unknown): ApiErrorBody["error"] | null {
  return error instanceof ApiError ? { code: error.code, message: error.message, fields: error.fields } : null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalTab, setAuthModalTab] = useState<"login" | "signup">("login")

  const sessionQuery = useQuery({
    queryKey: queryKeys.session(),
    queryFn: authApi.session,
    retry: false,
    staleTime: 60_000,
    // 401 just means "no session" — never surface it as an error toast.
    throwOnError: false,
  })

  const applySession = async (session: Session) => {
    setStoredToken(session.token)
    queryClient.setQueryData(queryKeys.session(), session)
    try {
      const guestCartId = getGuestCartId()
      await cartApi.merge(guestCartId)
    } finally {
      queryClient.invalidateQueries({ queryKey: ["cart"] })
      queryClient.invalidateQueries({ queryKey: ["quote"] })
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites() })
    }
  }

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: applySession,
  })

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: applySession,
  })

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      setStoredToken(null)
      // Wipe every cached resource — favorites, cart, orders, profile — so no
      // private data from this session leaks into the next login.
      queryClient.clear()
    },
  })

  const value = useMemo<AuthContextValue>(
    () => ({
      user: sessionQuery.data?.user ?? null,
      isAuthenticated: Boolean(sessionQuery.data?.user),
      isBootstrapping: sessionQuery.isLoading,
      login: (input) => loginMutation.mutateAsync(input),
      loginError: toErrorBody(loginMutation.error),
      isLoggingIn: loginMutation.isPending,
      register: (input) => registerMutation.mutateAsync(input),
      registerError: toErrorBody(registerMutation.error),
      isRegistering: registerMutation.isPending,
      logout: () => logoutMutation.mutateAsync(),
      authModalOpen,
      authModalTab,
      openAuthModal: (tab) => {
        setAuthModalTab(tab)
        setAuthModalOpen(true)
      },
      closeAuthModal: () => setAuthModalOpen(false),
    }),
    [sessionQuery.data, sessionQuery.isLoading, loginMutation, registerMutation, logoutMutation, authModalOpen, authModalTab],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
