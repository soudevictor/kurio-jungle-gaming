import { createFileRoute, Outlet, Link, useLocation, useNavigate } from "@tanstack/react-router"
import { LogOut, User, Wallet, Activity, Heart, Tag, Download, HelpCircle } from "lucide-react"
import { useAuth } from "@/features/auth/auth-context"

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfileLayout,
})

const sidebarLinks = [
  { href: "/profile", label: "Dados do perfil", icon: User },
  { href: "/profile/wallets", label: "Carteiras", icon: Wallet },
  { href: "#", label: "Atividade", icon: Activity },
  { href: "#", label: "Lista de interesse", icon: Heart },
  { href: "#", label: "Ofertas", icon: Tag },
  { href: "#", label: "Arquivos baixados", icon: Download },
  { href: "#", label: "Suporte", icon: HelpCircle },
]

export function ProfileLayout() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate({ to: "/" })
  }

  return (
    <div className="container-kurio py-8 md:py-12">
      <div className="flex flex-col gap-8 md:flex-row">
        <aside className="w-full shrink-0 md:w-64">
          <div className="py-2 bg-surface-card">
            <h3 className="m-2.5 font-heading text-lg font-semibold text-text-primary px-4 md:px-0">
              Meu perfil
            </h3>
            <nav className="space-y-1">
              {sidebarLinks.map((link) => {
                const isActive =
                  pathname === link.href || pathname === link.href + "/";
                return (
                  <Link
                    key={link.label}
                    to={link.href}
                    className={`flex items-center gap-3 px-4 py-3 text-sm font-medium text-text-accent transition-colors ${
                      isActive
                        ? "border-l-4 border-primary"
                        : "text-muted-foreground hover:text-text-primary"
                    }`}
                  >
                    <link.icon className="size-5" />
                    {link.label}
                  </Link>
                );
              })}
              <button 
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-text-accent border-t border-border transition-colors hover:text-text-primary"
              >
                <LogOut className="size-5" />
                Sair
              </button>
            </nav>
          </div>
        </aside>

        <div className="flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
