import { toast } from "sonner"

function outOfScopeToast() {
  toast("Fora do escopo desta entrega", {
    description: "Este link é apenas editorial e não faz parte do desafio.",
  })
}

const FEATURES = [
  {
    letter: "W",
    title: "Segurança da carteira",
    description:
      "Proteja sua carteira e colecione arte digital verificada com confiança.",
  },
  {
    letter: "C",
    title: "Criadores em destaque",
    description:
      "Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.",
  },
  {
    letter: "D",
    title: "Alertas de lançamentos",
    description:
      "Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.",
  },
]

const FOOTER_COLUMNS = [
  {
    title: "Meu perfil",
    items: ["Meu perfil", "Minha coleção", "Atividade", "Estúdio do criador", "Lista de interesse"],
  },
  {
    title: "Central de ajuda",
    items: ["Central de ajuda", "Como comprar NFTs", "Carteira e segurança", "Política do mercado", "Denunciar item"],
  },
  {
    title: "Coleções",
    items: ["Arte digital", "Fotografia", "Música", "Arte 3D", "Utilidade"],
  },
]

const SOCIAL_LINKS = [
  { label: "Facebook", letter: "f" },
  { label: "Instagram", letter: "in" },
  { label: "Twitter/X", letter: "𝕏" },
  { label: "LinkedIn", letter: "in" },
  { label: "YouTube", letter: "▶" },
]

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-surface">
      {/* Features section */}
      <div className="border-b border-border/60">
        <div className="container-kurio grid gap-6 py-12 md:grid-cols-[1fr_1fr_1fr_auto] md:gap-8">
          {FEATURES.map((feature) => (
            <div key={feature.letter} className="flex flex-col gap-3">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/20 font-heading text-lg font-bold text-primary">
                {feature.letter}
              </div>
              <h3 className="font-heading text-base font-semibold text-foreground">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}

          {/* Newsletter */}
          <div className="flex flex-col gap-3 md:min-w-[240px]">
            <h3 className="font-heading text-base font-semibold text-foreground">
              Antecipe-se ao próximo lançamento
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                outOfScopeToast()
              }}
              className="flex gap-2"
            >
              <input
                type="email"
                placeholder="Digite seu e-mail..."
                aria-label="Seu e-mail para newsletter"
                className="h-10 flex-1 rounded-md border border-border/60 bg-input px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="submit"
                className="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Enviar
              </button>
            </form>
            <p className="text-xs text-muted-foreground">
              Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
            </p>
          </div>
        </div>
      </div>

      {/* Brand bar */}
      <div className="border-b border-border/60 bg-surface/80">
        <div className="container-kurio flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-heading text-sm font-bold uppercase tracking-widest text-foreground">KURIO</p>
          <p className="text-sm text-muted-foreground">Feito para colecionadores, criadores e cultura</p>
          <p className="text-sm text-muted-foreground">contato@email.com</p>
          <p className="text-sm text-muted-foreground">+55 11 4002 8922</p>
        </div>
      </div>

      {/* Main footer columns */}
      <div className="container-kurio grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        {FOOTER_COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h3 className="mb-4 text-sm font-semibold text-foreground">{col.title}</h3>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              {col.items.map((item) => (
                <li key={item}>
                  <button
                    type="button"
                    onClick={outOfScopeToast}
                    className="text-left transition-colors hover:text-foreground"
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        {/* Social + Wallets */}
        <div>
          <h3 className="mb-4 text-sm font-semibold text-foreground">Redes sociais</h3>
          <div className="mb-6 flex gap-2">
            {SOCIAL_LINKS.map((social) => (
              <button
                key={social.label}
                type="button"
                onClick={outOfScopeToast}
                aria-label={social.label}
                className="flex size-8 items-center justify-center rounded-full border border-border/60 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
              >
                {social.letter}
              </button>
            ))}
          </div>

          <h3 className="mb-3 text-sm font-semibold text-foreground">Carteiras compatíveis</h3>
          <div className="flex flex-wrap items-center gap-2">
            {["METAMASK", "WALLETCONNECT", "COINBASE"].map((wallet) => (
              <span
                key={wallet}
                className="rounded border border-border/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {wallet}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-border/60 py-6">
        <div className="container-kurio flex flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Kurio. Propriedade digital para todos.</p>
          <p>Projeto de desafio frontend — dados e transações simulados.</p>
        </div>
      </div>
    </footer>
  )
}
