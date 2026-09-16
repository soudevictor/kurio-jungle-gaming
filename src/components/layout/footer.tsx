import { toast } from "sonner";

function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function TwitterIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
    </svg>
  );
}

function LinkedinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function YoutubeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M2.5 7.1C2.3 8.3 2.2 9.6 2.2 11c0 1.4.1 2.7.3 3.9.4 2.8 2.3 3.9 5.2 4.1 1.4.1 2.9.2 4.3.2s2.9-.1 4.3-.2c2.9-.2 4.8-1.3 5.2-4.1.2-1.2.3-2.5.3-3.9 0-1.4-.1-2.7-.3-3.9-.4-2.8-2.3-3.9-5.2-4.1-1.4-.1-2.9-.2-4.3-.2s-2.9.1-4.3.2c-2.9.2-4.8 1.3-5.2 4.1z" />
      <path d="m9.7 14.8 6-3.1-6-3.1v6.2z" />
    </svg>
  );
}

function outOfScopeToast() {
  toast("Fora do escopo desta entrega", {
    description: "Este link é apenas editorial e não faz parte do desafio.",
  });
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
];

const FOOTER_COLUMNS = [
  {
    title: "Meu perfil",
    items: [
      "Meu perfil",
      "Minha coleção",
      "Atividade",
      "Estúdio do criador",
      "Lista de interesse",
    ],
  },
  {
    title: "Central de ajuda",
    items: [
      "Central de ajuda",
      "Como comprar NFTs",
      "Carteira e segurança",
      "Política do mercado",
      "Denunciar item",
    ],
  },
  {
    title: "Coleções",
    items: ["Arte digital", "Fotografia", "Música", "Arte 3D", "Utilidade"],
  },
];

const SOCIAL_LINKS = [
  { label: "Facebook", icon: FacebookIcon },
  { label: "Instagram", icon: InstagramIcon },
  { label: "Twitter", icon: TwitterIcon },
  { label: "LinkedIn", icon: LinkedinIcon },
  { label: "YouTube", icon: YoutubeIcon },
];

export function Footer() {
  return (
    <footer className="container-kurio font-mono">
      {/* Features section */}
      <div className="bg-surface-card p-8">
        <div className="grid md:grid-cols-[1fr_1fr_1fr_1.4fr] md:divide-x md:divide-border/60">
          {FEATURES.map((feature) => (
            <div
              key={feature.letter}
              className="flex flex-col gap-6 py-4 md:py-0 md:px-4 first:md:pl-0 md:border-r md:border-primary"
            >
              <div className="flex size-[74px] items-center justify-center rounded-full bg-primary text-2xl font-bold text-ink">
                {feature.letter}
              </div>
              <div className="space-y-4">
                <h3 className="text-base font-bold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-text-secondary">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}

          {/* Newsletter */}
          <div className="flex flex-col gap-3 py-4 md:py-0 md:pl-4">
            <h3 className="text-lg font-bold text-foreground">
              Antecipe-se ao próximo
              <br />
              lançamento
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                outOfScopeToast();
              }}
              className="flex w-full"
            >
              <input
                type="email"
                placeholder="digite seu e-mail..."
                aria-label="Seu e-mail para newsletter"
                className="h-10 w-full min-w-0 flex-1 rounded-l-md border-0 bg-surface-raised px-4 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                className="h-10 rounded-r-md bg-primary px-4 text-lg font-bold text-ink transition-colors hover:bg-primary/90"
              >
                Enviar
              </button>
            </form>
            <p className="text-xs leading-relaxed text-text-secondary">
              Receba lançamentos selecionados, histórias de criadores e
              novidades do mercado.
            </p>
          </div>
        </div>
      </div>

      {/* Brand bar */}
      <div className="border-b border-border-soft/60 bg-surface-dark p-8">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-center text-sm text-foreground">
          <p className="font-bold tracking-widest text-base">KURIO</p>
          <p>
            Feito para colecionadores,
            <br className="hidden sm:block" /> criadores e cultura
          </p>
          <p>contato@email.com</p>
          <p>+55 11 4002 8922</p>
        </div>
      </div>

      {/* Main footer columns */}
      <div className="bg-surface-card p-8">
        <div className="grid gap-8 lg:gap-32 sm:grid-cols-2 lg:grid-cols-5">
          {FOOTER_COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className="mb-2 text-lg text-nowrap font-bold text-foreground">
                {col.title}
              </h3>
              <ul className="space-y-4 text-sm text-foreground">
                {col.items.map((item) => (
                  <li key={item}>
                    <button
                      type="button"
                      onClick={outOfScopeToast}
                      className="text-nowrap text-left transition-colors hover:text-primary"
                    >
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          {/* Social + Wallets */}
          <div className="lg:col-span-2">
            <h3 className="mb-5 text-lg font-bold text-foreground">
              Redes sociais
            </h3>
            <div className="mb-8 flex flex-wrap gap-3">
              {SOCIAL_LINKS.map((social) => {
                const Icon = social.icon;
                return (
                  <button
                    key={social.label}
                    type="button"
                    onClick={outOfScopeToast}
                    aria-label={social.label}
                    className="flex size-8 items-center justify-center rounded-md border border-primary text-primary transition-colors hover:bg-primary hover:text-white"
                  >
                    <Icon className="size-4" />
                  </button>
                );
              })}
            </div>

            <h3 className="mb-5 text-lg font-bold text-foreground">
              Carteiras compatíveis
            </h3>
            <div className="inline-flex items-center gap-2.5 whitespace-nowrap rounded-sm border border-border-soft bg-surface-dark p-2 text-xs font-bold tracking-widest text-text-accent">
              <span>METAMASK</span>
              <span className="text-[10px] text-text-accent">•</span>
              <span>WALLETCONNECT</span>
              <span className="text-[10px] text-text-accent">•</span>
              <span>COINBASE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="py-2 pb-32 lg:pb-6 flex items-center justify-center text-sm text-text-primary">
        <p>
          © {new Date().getFullYear()} Kurio. Propriedade digital para todos.
        </p>
      </div>
    </footer>
  );
}
