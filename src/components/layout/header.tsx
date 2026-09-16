import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/features/auth/auth-context";
import { useCart } from "@/features/cart/use-cart";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import {
  Heart,
  Home,
  LogOut,
  ScanLine,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// Only "Início" maps to a real route in this challenge's scope (README §3:
// "Páginas editoriais... não fazem parte da entrega"). The others are kept
// visible for layout fidelity but are inert on purpose — clicking them says
// so instead of pretending to navigate somewhere real.
const NAV_ITEMS = [
  { label: "Início", to: "/" as const },
  { label: "Mercado", to: null },
  { label: "Criadores", to: null },
  { label: "Aprenda", to: null },
];

function outOfScopeToast() {
  toast("Fora do escopo desta entrega", {
    description: "Esta seção é apenas editorial e não faz parte do desafio.",
  });
}

export function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [desktopSearchOpen, setDesktopSearchOpen] = useState(false);
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    navigate({
      to: "/",
      search: (prev) => ({
        ...prev,
        search: searchQuery || undefined,
        page: 1,
      }),
    });
    setDesktopSearchOpen(false);
  }

  return (
    <header className="z-40 bg-ink lg:sticky lg:top-0 lg:bg-ink/95 lg:backdrop-blur">
      {/* ── Mobile search bar (top row) — matches Figma "Search Bar" layer ── */}
      {pathname === "/" && (
        <div className="px-6 pb-3 pt-10 lg:hidden">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <label htmlFor="mobile-search" className="sr-only">
              Buscar NFTs
            </label>
            <div className="bg-surface-card rounded-[10px] relative flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-secondary"
                aria-hidden
              />
              <Input
                id="mobile-search"
                type="search"
                placeholder="Explorar coleções"
                className="h-11 rounded-xl border-0 bg-surface-card pl-10 text-sm font-medium placeholder:text-text-secondary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              type="button"
              size="icon"
              className="size-11 shrink-0 rounded-xl bg-primary text-ink hover:bg-primary/90"
              aria-label="Abrir filtros"
            >
              <SlidersHorizontal className="size-5" />
            </Button>
          </form>
        </div>
      )}

      {/* ── Main header row ─────────────────────────────────────────────────── */}
      <div className="container-kurio hidden h-14 items-center gap-6 lg:flex border-b border-primary/20">
        {/* Logo */}
        <Link
          to="/"
          className="shrink-0 font-heading text-sm font-bold uppercase tracking-[0.2em] text-text-primary"
          aria-label="Kurio — página inicial"
        >
          KURIO
        </Link>

        {/* Desktop Nav — centered */}
        <nav
          className="hidden flex-1 items-center justify-center gap-8 text-sm font-medium lg:flex"
          aria-label="Navegação principal"
        >
          {NAV_ITEMS.map((item) => {
            const isActive =
              (item.to === "/" && pathname === "/") ||
              (item.label === "Mercado" && pathname.startsWith("/nfts"));

            return item.to ? (
              <Link
                key={item.label}
                to={item.to}
                className={cn(
                  "relative pb-4 pt-4 transition-colors hover:text-primary",
                  isActive
                    ? "text-primary font-semibold border-b-3 border-primary"
                    : "text-foreground",
                )}
                activeOptions={{ exact: true }}
              >
                {item.label}
              </Link>
            ) : (
              <button
                key={item.label}
                type="button"
                className={cn(
                  "relative pb-4 pt-4 transition-colors hover:text-primary",
                  isActive
                    ? "text-primary font-semibold border-b-3 border-primary"
                    : "text-foreground",
                )}
                onClick={outOfScopeToast}
              >
                {item.label}
              </button>
            );
          })}
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
                <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-ink">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </Link>
          </Button>

          {/* Auth — desktop */}
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="gap-2 pl-1.5 pr-2"
                  aria-label="Menu da conta"
                >
                  <Avatar className="size-6">
                    <AvatarImage src={user?.avatarUrl ?? undefined} alt="" />
                    <AvatarFallback>
                      {user?.name?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium sm:inline">
                    {user?.name.split(" ")[0]}
                  </span>
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
                <DropdownMenuItem onSelect={() => logout()}>
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden items-center gap-2 lg:flex">
              <Button
                asChild
                className="gap-2.5 bg-primary font-heading text-sm font-medium text-ink hover:bg-primary/80"
              >
                <Link to="/login" className="!capitalize">
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
        <div className="hidden border-t border-border-soft/40 px-4 py-3 lg:block">
          <form onSubmit={handleSearchSubmit} className="mx-auto max-w-2xl">
            <label htmlFor="desktop-search" className="sr-only">
              Buscar NFTs
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-secondary"
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

      {/* Mobile expandable search bar */}
      {/* ... */}
      
      {!pathname.startsWith("/nfts/") && (
        <nav
          className="fixed inset-x-0 bottom-0 z-50 lg:hidden"
          style={{ filter: "drop-shadow(0px -10px 30px #0A060473)" }}
          aria-label="Navegação móvel"
        >
          {/* Background Layer */}
        <div className="absolute inset-0 -z-10 flex pt-[1px]">
          <div className="flex-1 rounded-tl-[29px] bg-surface-card" />
          <svg
            width="152"
            height="95"
            viewBox="0 0 151.7 95"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="-mx-[1px] shrink-0 text-surface-card"
          >
            <path
              d="M 0 0 C 13.75 0 25.98 8.2 31.83 20.65 C 39.59 37.18 56.39 48.62 75.85 48.62 C 95.31 48.62 112.11 37.17 119.87 20.65 C 125.72 8.2 137.94 0 151.7 0 L 151.7 95 L 0 95 Z"
              fill="currentColor"
            />
          </svg>
          <div className="flex-1 rounded-tr-[29px] bg-surface-card" />
        </div>

        {/* Content Layer */}
        <div className="flex h-24 items-center justify-around px-5">
          <Link
            to="/"
            className="flex size-11 items-center justify-center text-primary"
            aria-label="Início"
          >
            <Home className="size-5 fill-current" />
          </Link>
          <button
            type="button"
            className="flex size-11 items-center justify-center text-[#d9b17f]"
            onClick={outOfScopeToast}
            aria-label="Favoritos"
          >
            <Heart className="size-5 fill-current" />
          </button>
          <div className="relative flex h-full w-[110px] justify-center">
            <button
              type="button"
              className="absolute top-[-30px] z-10 flex size-16 items-center justify-center rounded-full text-text-primary transition-transform active:scale-95"
              style={{ background: "linear-gradient(180deg, rgba(210, 138, 76, 0.4) -16.92%, #D28A4C 109.23%)" }}
              onClick={outOfScopeToast}
              aria-label="Explorar coleções"
            >
              <ScanLine className="size-7" />
            </button>
          </div>
          <Link
            to="/cart"
            className="relative flex size-11 items-center justify-center text-[#d9b17f]"
            aria-label="Carrinho"
          >
            <ShoppingCart className="size-5 fill-current" />
            {itemCount > 0 && (
              <span className="absolute right-0 top-0 text-[10px] text-text-primary">
                {itemCount}
              </span>
            )}
          </Link>
          <Link
            to={isAuthenticated ? "/profile" : "/login"}
            className="flex size-11 items-center justify-center text-[#d9b17f]"
            aria-label="Perfil"
          >
            <User className="size-5 fill-current" />
          </Link>
        </div>
      </nav>
      )}
    </header>
  );
}
