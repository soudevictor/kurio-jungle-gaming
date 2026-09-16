import { createFileRoute } from "@tanstack/react-router"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CategorySidebar, CATEGORY_OPTIONS, categoryLabel } from "@/components/nft/catalog-filters"
import { NftCard } from "@/components/nft/nft-card"
import { NftGridSkeleton } from "@/components/nft/nft-card-skeleton"
import { Pagination } from "@/components/nft/pagination"
import { catalogSearchSchema } from "@/features/nfts/search-schema"
import { useNftList } from "@/features/nfts/use-nfts"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/")({
  validateSearch: catalogSearchSchema,
  component: HomePage,
})

const SORT_OPTIONS = [
  { value: "relevance", label: "Listados recentemente" },
  { value: "recent", label: "Novos lançamentos" },
  { value: "trending", label: "Em alta" },
  { value: "price-asc", label: "Menor preço" },
  { value: "price-desc", label: "Maior preço" },
] as const

const TAB_OPTIONS = [
  { value: "all", label: "Todos os NFTs" },
  { value: "recent", label: "Novos lançamentos" },
  { value: "trending", label: "Em alta" },
] as const

// NFT images for the mobile hero stacked display (nft-001 and nft-002)
const HERO_IMAGES = [
  { src: "/assets/nft/nft-001.svg", alt: "NFT Kurio #001 — macaco com óculos escuros" },
  { src: "/assets/nft/nft-002.svg", alt: "NFT Kurio #002 — macaco com boné" },
]

function HomePage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const { data, isLoading, isError, isPlaceholderData } = useNftList({
    search: search.search,
    category: search.category,
    sort: search.sort,
    page: search.page,
    pageSize: 12,
  })

  function updateSearch(patch: Partial<typeof search>) {
    navigate({ search: (prev) => ({ ...prev, ...patch }) })
  }

  const categoryOptions = CATEGORY_OPTIONS.map((value) => ({
    value,
    label: categoryLabel(value),
    count:
      value === "all"
        ? Object.values(data?.categoryCounts ?? {}).reduce((a, b) => a + b, 0)
        : (data?.categoryCounts?.[value] ?? 0),
  }))

  // Active tab derived from sort param
  const activeTab = search.sort === "recent" || search.sort === "trending" ? search.sort : "all"

  return (
    <div>
      {/* ─── Hero Section ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-ink">
        {/* Desktop Hero */}
        <div className="container-kurio hidden items-center gap-16 py-12 lg:grid lg:grid-cols-[1fr_360px]">
          <div className="max-w-[460px]">
            <p className="mb-3 text-xs font-medium text-primary">Bem-vindo à Kurio</p>
            <h1 className="font-heading text-4xl font-bold uppercase leading-[1.25] tracking-tight">
              Seja dono do futuro da arte digital
            </h1>
            <p className="mt-3 max-w-md text-xs leading-relaxed text-text-secondary">
              Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie
              artistas e tenha uma parte da cultura da internet.
            </p>
            <Button size="sm" className="mt-5 font-heading text-xs uppercase tracking-wide" asChild>
              <a href="#catalog">Explorar</a>
            </Button>
          </div>
          <div className="relative mx-auto aspect-square w-full max-w-[360px] overflow-hidden rounded-2xl">
            <img src="/assets/hero.svg" alt="Emerald Ape #042 — NFT em destaque na Kurio" className="size-full object-cover" />
            {/* Carousel dots */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
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
        </div>

        {/* Mobile Hero — matches Figma "Mobile / Início" Hero Banner */}
        <div className="relative mx-6 mb-4 overflow-hidden rounded-[1.75rem] lg:hidden" style={{ background: "radial-gradient(circle at 8% 5%, #a56635 0%, #4a2716 48%, #25160f 100%)" }}>
          {/* Decorative circles */}
          <div
            className="pointer-events-none absolute -left-8 -top-8 size-40 rounded-full opacity-40"
            style={{ background: "radial-gradient(circle, #7a3a1a 0%, transparent 70%)" }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-12 left-1/3 size-48 rounded-full opacity-30"
            style={{ background: "radial-gradient(circle, #6b2e12 0%, transparent 70%)" }}
            aria-hidden
          />

          <div className="relative flex h-[188px] items-start gap-2 px-4 py-3">
            {/* Text */}
            <div className="flex-1">
              <p className="mb-1 text-xs font-medium text-text-primary">Bem-vindo à Kurio</p>
              <h1 className="font-heading text-xl font-bold uppercase leading-[1.45] tracking-tight text-text-primary">
                Seja dono da cultura digital
              </h1>
              <p className="mt-2 text-xs leading-relaxed text-text-primary/70">
                Descubra NFTs selecionados de criadores do mundo todo.
              </p>
              <a
                href="#catalog"
                className="mt-1 inline-flex items-center gap-2 font-heading text-xs font-semibold uppercase tracking-wide text-primary"
              >
                Explorar <ArrowRight className="size-4" />
              </a>
            </div>

            {/* Stacked NFT images */}
            <div className="relative mt-0 shrink-0" style={{ width: 136, height: 150 }}>
              <div className="absolute right-0 top-0 overflow-hidden rounded-2xl shadow-lg" style={{ width: 136, height: 136 }}>
                <img
                  src={HERO_IMAGES[0].src}
                  alt={HERO_IMAGES[0].alt}
                  className="size-full object-cover"
                  width={110}
                  height={110}
                />
              </div>
              <div
                className="absolute bottom-0 right-0 overflow-hidden rounded-2xl shadow-lg"
                style={{ width: 76, height: 76 }}
              >
                <img
                  src={HERO_IMAGES[1].src}
                  alt={HERO_IMAGES[1].alt}
                  className="size-full object-cover"
                  width={90}
                  height={90}
                />
              </div>
            </div>
          </div>

          {/* Carousel dots */}
          <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-2 pb-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={cn("block size-2 rounded-full transition-colors", i === 0 ? "bg-primary" : "bg-text-primary/20")}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── Catalog Section ──────────────────────────────────────────────────── */}
      <section id="catalog" className="container-kurio pb-32 pt-1 lg:py-10">

        <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
          {/* Sidebar — desktop only */}
          <aside className="hidden lg:block">
            <CategorySidebar
              options={categoryOptions}
              active={search.category}
              onChange={(value) => updateSearch({ category: value, page: 1 })}
            />
          </aside>

          {/* Main content */}
          <div>
            {/* Tabs + Sort row */}
            <div className="mb-4 flex flex-col gap-1 border-b border-border-soft/60 lg:mb-6 lg:flex-row lg:items-end lg:justify-between">
              {/* Tab navigation */}
              <nav className="flex gap-0 overflow-x-auto" aria-label="Filtrar por destaque">
                {TAB_OPTIONS.map((tab) => {
                  const isActive = activeTab === tab.value || (tab.value === "all" && activeTab === "all")
                  return (
                    <button
                      key={tab.value}
                      type="button"
                      onClick={() => updateSearch({ sort: tab.value === "all" ? "relevance" : tab.value, page: 1 })}
                      className={cn(
                        "relative whitespace-nowrap px-2 py-2 text-xs font-medium transition-colors sm:px-4 sm:py-3 sm:text-sm",
                        isActive
                          ? "text-primary after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-primary"
                          : "text-text-secondary hover:text-text-primary",
                      )}
                    >
                      {tab.label}
                    </button>
                  )
                })}
              </nav>

              {/* Sort dropdown */}
              <div className="hidden items-center gap-2 pb-3 lg:flex">
                <span className="text-xs text-text-secondary">Ordenar por:</span>
                <Select
                  value={search.sort}
                  onValueChange={(v) => updateSearch({ sort: v as typeof search.sort, page: 1 })}
                >
                  <SelectTrigger
                    className="w-[200px] border-none bg-transparent text-sm font-medium shadow-none focus:ring-0"
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
                Não foi possível carregar o catálogo agora. Tente novamente em instantes.
              </div>
            )}

            {isLoading && <NftGridSkeleton />}

            {!isLoading && !isError && data && data.items.length === 0 && (
              <div className="rounded-lg border border-border-soft/60 bg-surface-card p-12 text-center">
                <p className="font-heading text-lg font-semibold">Nenhum NFT encontrado</p>
                <p className="mt-1 text-sm text-text-secondary">
                  Tente ajustar a busca ou remover alguns filtros.
                </p>
              </div>
            )}

            {!isLoading && !isError && data && data.items.length > 0 && (
              <div
                className="grid grid-cols-2 gap-x-5 gap-y-6 transition-opacity sm:grid-cols-3 lg:gap-x-6 lg:gap-y-8"
                style={{ opacity: isPlaceholderData ? 0.6 : 1 }}
              >
                {data.items.map((nft) => (
                  <NftCard key={nft.id} nft={nft} />
                ))}
              </div>
            )}

            {data && data.totalPages > 1 && (
              <div className="mt-8">
                <Pagination page={data.page} totalPages={data.totalPages} onChange={(p) => updateSearch({ page: p })} />
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
