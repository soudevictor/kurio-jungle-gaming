import { Link, useNavigate } from "@tanstack/react-router"
import { Heart, Home, ScanLine, Search, ShoppingCart, SlidersHorizontal, User, LogOut } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/features/auth/auth-context"
import { useCart } from "@/features/cart/use-cart"

// Only "Início" maps to a real route in this challenge's scope (README §3:
// "Páginas editoriais... não fazem parte da entrega"). The others are kept
// visible for layout fidelity but are inert on purpose — clicking them says
// so instead of pretending to navigate somewhere real.
const NAV_ITEMS = [
  { label: "Início", to: "/" as const },
  { label: "Mercado", to: null },
  { label: "Criadores", to: null },
  { label: "Aprenda", to: null },
]

function outOfScopeToast() {
  toast("Fora do escopo desta entrega", {
    description: "Esta seção é apenas editorial e não faz parte do desafio.",
  })
}

export function Header() {
  const { isAuthenticated, user, logout } = useAuth()
  const { itemCount } = useCart()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState("")
  const [desktopSearchOpen, setDesktopSearchOpen] = useState(false)

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    navigate({ to: "/", search: (prev) => ({ ...prev, search: searchQuery || undefined, page: 1 }) })
    setDesktopSearchOpen(false)
  }

  return (
    <header className="z-40 bg-background lg:sticky lg:top-0 lg:border-b lg:border-border/40 lg:bg-background/95 lg:backdrop-blur">
      {/* ── Mobile search bar (top row) — matches Figma "Search Bar" layer ── */}
      <div className="px-6 pb-3 pt-10 lg:hidden">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <label htmlFor="mobile-search" className="sr-only">
            Buscar NFTs
          </label>
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="mobile-search"
              type="search"
              placeholder="Buscar NFTs, coleções ou criadores"
              className="h-11 rounded-xl border-0 bg-card pl-10 text-sm font-medium placeholder:text-muted-foreground"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button type="button" size="icon" className="size-11 shrink-0 rounded-xl" aria-label="Abrir filtros">
            <SlidersHorizontal className="size-5" />
          </Button>
        </form>
      </div>

      {/* ── Main header row ─────────────────────────────────────────────────── */}
      <div className="container-kurio hidden h-14 items-center gap-6 lg:flex">
        {/* Logo */}
        <Link
          to="/"
          className="shrink-0 font-heading text-lg font-bold uppercase tracking-[0.2em] text-foreground"
          aria-label="Kurio — página inicial"
        >
          KURIO
        </Link>

        {/* Desktop Nav — centered */}
        <nav
          className="hidden flex-1 items-center justify-center gap-8 text-sm font-medium lg:flex"
          aria-label="Navegação principal"
        >
          {NAV_ITEMS.map((item) =>
            item.to ? (
              <Link
                key={item.label}
                to={item.to}
                className="relative py-1 text-foreground/80 transition-colors hover:text-foreground"
                activeProps={{
                  className:
                    "relative py-1 text-foreground font-semibold after:absolute after:bottom-[-20px] after:left-0 after:w-full after:h-[2px] after:bg-primary",
                }}
                activeOptions={{ exact: true }}
              >
                {item.label}
              </Link>
            ) : (
              <button
                key={item.label}
                type="button"
                className="py-1 text-muted-foreground transition-colors hover:text-foreground"
                onClick={outOfScopeToast}
              >
                {item.label}
              </button>
            ),
          )}
        </nav>

        {/* Right actions */}
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          {/* Desktop search icon (toggle) */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:inline-flex"
            aria-label="Buscar NFTs"
            onClick={() => setDesktopSearchOpen((v) => !v)}
          >
            <Search className="size-5" />
          </Button>

          {/* Cart */}
          <Button
            variant="ghost"
            size="icon"
            asChild
            aria-label={`Carrinho${itemCount > 0 ? `, ${itemCount} itens` : ""}`}
          >
            <Link to="/cart" className="relative">
              <ShoppingCart className="size-5" />
              {itemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </Link>
          </Button>

          {/* Auth — desktop */}
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 pl-1.5 pr-2" aria-label="Menu da conta">
                  <Avatar className="size-6">
                    <AvatarImage src={user?.avatarUrl ?? undefined} alt="" />
                    <AvatarFallback>{user?.name?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium sm:inline">{user?.name.split(" ")[0]}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/profile">
                    <User className="size-4" /> Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/profile/wallets">Carteiras</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => logout()}>Sair</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden items-center gap-2 lg:flex">
              <Button
                asChild
                className="gap-1.5 bg-primary font-heading text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <Link to="/login">
                  <LogOut className="size-4" />
                  Entrar
                </Link>
              </Button>
            </div>
          )}

        </div>
      </div>

      {/* Desktop expandable search bar */}
      {desktopSearchOpen && (
        <div className="hidden border-t border-border/40 px-4 py-3 lg:block">
          <form onSubmit={handleSearchSubmit} className="mx-auto max-w-2xl">
            <label htmlFor="desktop-search" className="sr-only">
              Buscar NFTs
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                id="desktop-search"
                type="search"
                placeholder="Buscar NFTs, coleções ou criadores"
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
          </form>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-50 flex h-24 items-center justify-around rounded-t-[2rem] bg-card px-5 shadow-[0_-8px_28px_rgba(0,0,0,.25)] lg:hidden" aria-label="Navegação móvel">
        <Link to="/" className="flex size-11 items-center justify-center text-primary" aria-label="Início"><Home className="size-5 fill-current" /></Link>
        <button type="button" className="flex size-11 items-center justify-center text-[#d9b17f]" onClick={outOfScopeToast} aria-label="Favoritos"><Heart className="size-5 fill-current" /></button>
        <button type="button" className="-mt-10 flex size-16 items-center justify-center rounded-full border-8 border-background bg-primary text-primary-foreground shadow-lg" onClick={outOfScopeToast} aria-label="Explorar coleções"><ScanLine className="size-7" /></button>
        <Link to="/cart" className="relative flex size-11 items-center justify-center text-[#d9b17f]" aria-label="Carrinho"><ShoppingCart className="size-5 fill-current" />{itemCount > 0 && <span className="absolute right-0 top-0 text-[10px] text-foreground">{itemCount}</span>}</Link>
        <Link to={isAuthenticated ? "/profile" : "/login"} className="flex size-11 items-center justify-center text-[#d9b17f]" aria-label="Perfil"><User className="size-5 fill-current" /></Link>
      </nav>
    </header>
  )
}
