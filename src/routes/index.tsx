import {
  CATEGORY_OPTIONS,
  categoryLabel,
  CategorySidebar,
} from "@/components/nft/catalog-filters";
import { NftCard } from "@/components/nft/nft-card";
import { NftGridSkeleton } from "@/components/nft/nft-card-skeleton";
import { Pagination } from "@/components/nft/pagination";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { catalogSearchSchema } from "@/features/nfts/search-schema";
import { useNftList } from "@/features/nfts/use-nfts";
import { cn } from "@/lib/utils";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  validateSearch: catalogSearchSchema,
  component: HomePage,
});

const SORT_OPTIONS = [
  { value: "relevance", label: "Listados recentemente" },
  { value: "recent", label: "Novos lançamentos" },
  { value: "trending", label: "Em alta" },
  { value: "price-asc", label: "Menor preço" },
  { value: "price-desc", label: "Maior preço" },
] as const;

const TAB_OPTIONS = [
  { value: "all", label: "Todos os NFTs" },
  { value: "recent", label: "Novos lançamentos" },
  { value: "trending", label: "Em alta" },
] as const;

// NFT images for the mobile hero stacked display (nft-001 and nft-002)
const HERO_IMAGES = [
  {
    src: "/assets/nft/nft-001.svg",
    alt: "NFT Kurio #001 — macaco com óculos escuros",
  },
  { src: "/assets/nft/nft-002.svg", alt: "NFT Kurio #002 — macaco com boné" },
];

function HomePage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data, isLoading, isError, isPlaceholderData } = useNftList({
    search: search.search,
    category: search.category,
    sort: search.sort,
    minPrice: search.minPrice,
    maxPrice: search.maxPrice,
    networks: search.networks,
    page: search.page,
    pageSize: 12,
  });

  function updateSearch(patch: Partial<typeof search>) {
    navigate({ search: (prev) => ({ ...prev, ...patch }) });
  }

  const categoryOptions = CATEGORY_OPTIONS.map((value) => ({
    value,
    label: categoryLabel(value),
    count:
      value === "all"
        ? Object.values(data?.categoryCounts ?? {}).reduce((a, b) => a + b, 0)
        : (data?.categoryCounts?.[value] ?? 0),
  }));

  // Active tab derived from sort param
  const activeTab =
    search.sort === "recent" || search.sort === "trending"
      ? search.sort
      : "all";

  return (
    <div>
      {/* ─── Hero Section ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-ink">
        {/* Desktop Hero */}
        <div className="container-kurio hidden items-center gap-16 py-12 lg:grid lg:grid-cols-[1fr_450px]">
          <div className="max-w-[600px] pl-10">
            <p className="mb-2 text-base font-medium text-foreground">
              Bem-vindo à Kurio
            </p>
            <h1 className="font-heading text-5xl font-bold uppercase leading-[1.25] tracking-tight">
              Seja dono do futuro da arte digital
            </h1>
            <p className="mt-1 max-w-md text-sm leading-relaxed text-text-secondary">
              Descubra NFTs selecionados de criadores emergentes e consagrados.
              Colecione arte digital rara, apoie artistas e tenha uma parte da
              cultura da internet.
            </p>
            <Button
              size="lg"
              className="mt-8 h-10 w-36 py-2.5 px-9 font-heading text-base font-bold uppercase tracking-wide"
              asChild
            >
              <a href="#catalog">Explorar</a>
            </Button>

            {/* Carousel dots */}
            <div className="flex justify-end gap-2">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={cn(
                    "block size-2 rounded-full transition-colors",
                    i === 0 ? "bg-primary" : "bg-text-primary/20",
                  )}
                />
              ))}
            </div>
          </div>
          <div className="relative mx-auto aspect-square w-full max-w-[450px] overflow-hidden rounded-3xl">
            <img
              src="/assets/hero.svg"
              alt="Emerald Ape #042 — NFT em destaque na Kurio"
              className="size-full object-cover"
            />
          </div>
        </div>

        {/* Mobile Hero — matches Figma "Mobile / Início" Hero Banner */}
        <div className="relative mx-6 mb-4 overflow-hidden rounded-[1.75rem] bg-surface-card lg:hidden">
          {/* Decorative circles */}
          <div
            className="pointer-events-none absolute -left-12 -top-4 size-64 rounded-full"
            style={{
              background:
                "linear-gradient(160.25deg, rgba(221, 154, 95, 0.43) 22.1%, rgba(210, 138, 76, 0.04) 87.42%)",
            }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-7 left-1/5 size-64 rounded-full"
            style={{
              background:
                "linear-gradient(160.25deg, rgba(221, 154, 95, 0.37) 22.1%, rgba(210, 138, 76, 0) 87.42%)",
            }}
            aria-hidden
          />

          <div className="relative flex h-[210px] items-center gap-2 px-6 py-4">
            {/* Text */}
            <div className="flex-1">
              <p className="mb-2 text-xs font-medium text-foreground">
                Bem-vindo à Kurio
              </p>
              <h1 className="font-heading text-lg font-bold uppercase leading-7 tracking-tight text-foreground">
                SEJA DONO DA
                <br />
                CULTURA DIGITAL
              </h1>
              <p className="mt-3 text-xs leading-relaxed text-text-secondary">
                Descubra NFTs selecionados de criadores do mundo todo.
              </p>
              <a
                href="#catalog"
                className="mt-4 inline-flex items-center gap-2 font-heading text-xs font-bold uppercase tracking-widest text-text-accent"
              >
                EXPLORAR <ArrowRight className="size-4" />
              </a>
            </div>

            {/* Stacked NFT images */}
            <div
              className="relative shrink-0 pr-1 mt-2"
              style={{ width: 146, height: 146 }}
            >
              <div
                className="absolute right-0 top-0 overflow-hidden rounded-2xl"
                style={{ width: 138, height: 138 }}
              >
                <img
                  src={HERO_IMAGES[0].src}
                  alt={HERO_IMAGES[0].alt}
                  className="size-full object-cover"
                />
              </div>
              <div
                className="absolute -bottom-2 left-5 overflow-hidden rounded-2xl"
                style={{ width: 58, height: 58 }}
              >
                <img
                  src={HERO_IMAGES[1].src}
                  alt={HERO_IMAGES[1].alt}
                  className="size-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Carousel dots */}
          <div className="flex justify-center gap-2 pb-2">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={cn(
                  "block size-2 rounded-full",
                  i === 0 ? "bg-primary" : "bg-text-primary/20",
                )}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── Catalog Section ──────────────────────────────────────────────────── */}
      <section id="catalog" className="container-kurio pb-32 pt-1 lg:py-10">
        <div className="grid gap-8 lg:grid-cols-[310px_1fr]">
          {/* Sidebar — desktop only */}
          <aside className="hidden lg:block">
            <CategorySidebar
              options={categoryOptions}
              active={search.category}
              searchParams={{
                minPrice: search.minPrice,
                maxPrice: search.maxPrice,
                networks: search.networks,
              }}
              onChange={(patch) => updateSearch(patch)}
            />
          </aside>

          {/* Main content */}
          <div>
            {/* Tabs + Sort row */}
            <div className="mb-4 flex flex-col gap-1 lg:mb-6 lg:flex-row lg:items-end lg:justify-between">
              {/* Tab navigation */}
              <nav
                className="flex gap-0 overflow-x-auto"
                aria-label="Filtrar por destaque"
              >
                {TAB_OPTIONS.map((tab) => {
                  const isActive =
                    activeTab === tab.value ||
                    (tab.value === "all" && activeTab === "all");
                  return (
                    <button
                      key={tab.value}
                      type="button"
                      onClick={() =>
                        updateSearch({
                          sort: tab.value === "all" ? "relevance" : tab.value,
                          page: 1,
                        })
                      }
                      className={cn(
                        "relative whitespace-nowrap px-2 py-2 text-xs font-medium transition-colors sm:px-4 sm:py-3 sm:text-sm",
                        isActive
                          ? "text-primary after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-primary"
                          : "text-text-secondary hover:text-text-primary",
                      )}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </nav>

              {/* Sort dropdown */}
              <div className="hidden items-center gap-2 pb-3 lg:flex">
                <span className="text-xs text-text-secondary">
                  Ordenar por:
                </span>
                <Select
                  value={search.sort}
                  onValueChange={(v) =>
                    updateSearch({ sort: v as typeof search.sort, page: 1 })
                  }
                >
                  <SelectTrigger
                    className="w-[200px] border-none bg-transparent text-sm font-medium shadow-none focus:ring-0 text-text-secondary"
                    aria-label="Ordenar resultados"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isError && (
              <div className="rounded-lg border border-error/30 bg-error/10 p-6 text-center text-sm text-error">
                Não foi possível carregar o catálogo agora. Tente novamente em
                instantes.
              </div>
            )}

            {isLoading && <NftGridSkeleton />}

            {!isLoading && !isError && data && data.items.length === 0 && (
              <div className="rounded-lg border border-border-soft/60 bg-surface-card p-12 text-center">
                <p className="font-heading text-lg font-semibold">
                  Nenhum NFT encontrado
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                  Tente ajustar a busca ou remover alguns filtros.
                </p>
              </div>
            )}

            {!isLoading && !isError && data && data.items.length > 0 && (
              <div
                className="grid grid-cols-2 gap-x-5 gap-y-6 transition-opacity [&>*:nth-child(even)]:mt-8 sm:[&>*:nth-child(even)]:mt-0 sm:grid-cols-3 lg:gap-x-9 lg:gap-y-16"
                style={{ opacity: isPlaceholderData ? 0.6 : 1 }}
              >
                {data.items.map((nft) => (
                  <NftCard key={nft.id} nft={nft} />
                ))}
              </div>
            )}

            {data && data.totalPages > 1 && (
              <div className="mt-8 lg:flex lg:justify-end">
                <Pagination
                  page={data.page}
                  totalPages={data.totalPages}
                  onChange={(p) => updateSearch({ page: p })}
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── Promos Section ─────────────────────────────────────────────────── */}
      <section className="container-kurio pb-16 lg:pb-24">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Promo Card 1 */}
          <div className="flex flex-col sm:flex-row items-center overflow-hidden rounded-3xl bg-surface-card">
            <div className="w-full sm:w-1/2">
              <img
                src="/assets/nft/nft-001.svg"
                alt="Lançamentos gênesis"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex w-full sm:w-1/2 flex-col items-center sm:items-end justify-center p-8 text-center sm:text-right">
              <h3 className="font-heading text-lg text-nowrap font-medium leading-snug text-text-primary mb-3">
                Lançamentos gênesis
                <br />
                de edição limitada
              </h3>
              <p className="text-sm text-text-secondary mb-6 leading-relaxed">
                Colecione edições escassas
                <br />
                diretamente dos criadores antes
                <br />
                da revelação pública.
              </p>
              <Button className="h-10 w-36 py-2.5 px-9 font-heading text-base capitalize tracking-wide">
                Explorar <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
          {/* Promo Card 2 */}
          <div className="flex flex-col sm:flex-row items-center overflow-hidden rounded-3xl bg-surface-card">
            <div className="w-full sm:w-1/2">
              <img
                src="/assets/nft/nft-003.svg"
                alt="Arte digital selecionada"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex w-full sm:w-1/2 flex-col items-center sm:items-end justify-center p-8 text-center sm:text-right">
              <h3 className="font-heading text-lg text-nowrap font-medium leading-snug text-text-primary mb-3">
                Arte digital selecionada
                <br />e muito mais
              </h3>
              <p className="text-sm text-text-secondary mb-6 leading-relaxed">
                Explore novos artistas,
                <br />
                coleções verificadas e obras
                <br />
                digitais que definem a cultura.
              </p>
              <Button className="h-10 w-36 py-2.5 px-9 font-heading text-base capitalize tracking-wide">
                Explorar <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Journal / Articles Section ───────────────────────────────────────── */}
      <section className="container-kurio pb-24 lg:pb-32">
        <div className="text-center mb-12">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Diário da Cunhagem
          </h2>
          <p className="mt-3 text-sm text-text-secondary md:text-nowrap max-w-lg mx-auto">
            Histórias, guias e insights para colecionadores sobre o universo da
            propriedade digital.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Article 1 */}
          <article className="group cursor-pointer overflow-hidden rounded-2xl flex flex-col">
            <div className="relative aspect-square w-full overflow-hidden">
              <img
                src="/assets/nft/nft-004.svg"
                alt="Artigo 1"
                className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="flex flex-1 flex-col justify-between bg-surface-card p-6">
              <div>
                <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-text-secondary">
                  12 de setembro <span className="mx-1">|</span> Leitura de 6
                  min
                </p>
                <h3 className="mb-3 font-heading text-lg font-bold leading-snug text-text-primary transition-colors group-hover:text-primary">
                  Como funciona a propriedade de NFTs
                </h3>
                <p className="line-clamp-2 text-sm leading-relaxed text-text-secondary">
                  Aprenda a colecionar, negociar e verificar ativos digitais.
                </p>
              </div>
              <a
                href="#article"
                className="mt-6 inline-flex items-center gap-2 font-heading text-xs font-semibold uppercase tracking-wide text-primary"
              >
                Ler mais <ArrowRight className="size-4" />
              </a>
            </div>
          </article>
          {/* Article 2 */}
          <article className="group cursor-pointer overflow-hidden rounded-2xl flex flex-col">
            <div className="relative aspect-square w-full overflow-hidden">
              <img
                src="/assets/hero.svg"
                alt="Artigo 2"
                className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="flex flex-1 flex-col justify-between bg-surface-card p-6">
              <div>
                <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-text-secondary">
                  13 de setembro <span className="mx-1">|</span> Leitura de 2
                  min
                </p>
                <h3 className="mb-3 font-heading text-lg font-bold leading-snug text-text-primary transition-colors group-hover:text-primary">
                  10 artistas digitais para acompanhar
                </h3>
                <p className="line-clamp-2 text-sm leading-relaxed text-text-secondary">
                  Conheça criadores que moldam a cultura digital.
                </p>
              </div>
              <a
                href="#article"
                className="mt-6 inline-flex items-center gap-2 font-heading text-xs font-semibold uppercase tracking-wide text-primary"
              >
                Ler mais <ArrowRight className="size-4" />
              </a>
            </div>
          </article>
          {/* Article 3 */}
          <article className="group cursor-pointer overflow-hidden rounded-2xl flex flex-col">
            <div className="relative aspect-square w-full overflow-hidden">
              <img
                src="/assets/nft/nft-003.svg"
                alt="Artigo 3"
                className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="flex flex-1 flex-col justify-between bg-surface-card p-6">
              <div>
                <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-text-secondary">
                  15 de setembro <span className="mx-1">|</span> Leitura de 3
                  min
                </p>
                <h3 className="mb-3 font-heading text-lg font-bold leading-snug text-text-primary transition-colors group-hover:text-primary">
                  Raridade, atributos e procedência
                </h3>
                <p className="line-clamp-2 text-sm leading-relaxed text-text-secondary">
                  Entenda raridade, procedência, direitos autorais e utilidade.
                </p>
              </div>
              <a
                href="#article"
                className="mt-6 inline-flex items-center gap-2 font-heading text-xs font-semibold uppercase tracking-wide text-primary"
              >
                Ler mais <ArrowRight className="size-4" />
              </a>
            </div>
          </article>
          {/* Article 4 */}
          <article className="group cursor-pointer overflow-hidden rounded-2xl flex flex-col">
            <div className="relative aspect-square w-full overflow-hidden">
              <img
                src="/assets/nft/nft-002.svg"
                alt="Artigo 4"
                className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="flex flex-1 flex-col justify-between bg-surface-card p-6">
              <div>
                <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-text-secondary">
                  15 de setembro <span className="mx-1">|</span> Leitura de 2
                  min
                </p>
                <h3 className="mb-3 font-heading text-lg font-bold leading-snug text-text-primary transition-colors group-hover:text-primary">
                  Como proteger sua carteira
                </h3>
                <p className="line-clamp-2 text-sm leading-relaxed text-text-secondary">
                  Proteja sua carteira, seus ativos e sua identidade.
                </p>
              </div>
              <a
                href="#article"
                className="mt-6 inline-flex items-center gap-2 font-heading text-xs font-semibold uppercase tracking-wide text-primary"
              >
                Ler mais <ArrowRight className="size-4" />
              </a>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
