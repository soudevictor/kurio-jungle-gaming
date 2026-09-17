import type { QueryClient } from "@tanstack/react-query"
import { createRootRouteWithContext, Link, Outlet, useRouterState } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { AuthModal } from "@/components/auth/auth-modal"
import { MockControlPanel } from "@/mocks/mock-control-panel"
import { Footer } from "@/components/layout/footer"
import { Header } from "@/components/layout/header"
import { SessionExpiryWatcher } from "@/features/auth/session-expiry-watcher"
import { useAuth } from "@/features/auth/auth-context"

interface RouterContext {
  queryClient: QueryClient
}

const mocksEnabled = import.meta.env.VITE_ENABLE_MOCKS !== "false"

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFound,
})

function RootLayout() {
  const routerState = useRouterState()
  const pathname = routerState.location.pathname
  const { authModalOpen, authModalTab, closeAuthModal } = useAuth()

  const isCheckoutRoute = pathname === "/checkout"
  const isOrderRoute = pathname.startsWith("/orders")
  const isProfileRoute = pathname.startsWith("/profile")

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Pular para o conteúdo
      </a>
      <SessionExpiryWatcher />
      <Header />
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>
      {!isOrderRoute && !isProfileRoute && (
        <div className={isCheckoutRoute ? "hidden md:block" : ""}>
          <Footer />
        </div>
      )}
      {mocksEnabled && <MockControlPanel />}

      {/* Auth modals — rendered as overlays instead of navigating to separate pages */}
      <AuthModal
        open={authModalOpen}
        defaultTab={authModalTab}
        onClose={closeAuthModal}
      />
    </div>
  )
}

function NotFound() {
  return (
    <div className="container-kurio flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="font-heading text-6xl font-bold text-primary">404</p>
      <h1 className="mt-2 font-heading text-2xl font-bold">Página não encontrada</h1>
      <p className="mt-1 text-muted-foreground">O endereço acessado não existe.</p>
      <Button className="mt-6" asChild>
        <Link to="/">Voltar ao início</Link>
      </Button>
    </div>
  )
}
