import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router"
import { ArrowLeft, Heart, Minus, Plus, ShoppingCart } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/features/auth/auth-context"
import { useCart } from "@/features/cart/use-cart"
import { useFavorites } from "@/features/favorites/use-favorites"
import { useNftDetail } from "@/features/nfts/use-nfts"
import { ApiError } from "@/lib/api/client"
import { formatEth } from "@/lib/money"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/nfts/$nftId")({
  component: NftDetailPage,
  notFoundComponent: () => (
    <div className="container-kurio py-24 text-center">
      <h1 className="font-heading text-2xl font-bold">NFT não encontrado</h1>
      <p className="mt-2 text-text-secondary">Este item não existe ou foi removido do catálogo.</p>
      <Button className="mt-6" asChild>
        <Link to="/">Voltar ao início</Link>
      </Button>
    </div>
  ),
})

function outOfScopeToast() {
  toast("Fora do escopo desta entrega", {
    description: "Esta funcionalidade não faz parte do desafio.",
  })
}

/** Loading skeleton — same proportions as the real layout to guarantee CLS=0 */
function NftDetailSkeleton() {
  return (
    <div className="container-kurio py-12 lg:py-16">
      {/* Breadcrumb */}
      <Skeleton className="skeleton-shimmer mb-10 h-4 w-36" />
      <div className="grid gap-12 lg:grid-cols-[500px_1fr] lg:gap-24">
        {/* Gallery */}
        <div className="flex gap-3">
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="skeleton-shimmer size-[72px] rounded-lg" />
            ))}
          </div>
          <Skeleton className="skeleton-shimmer aspect-square flex-1 rounded-2xl" />
        </div>
        {/* Info */}
        <div className="space-y-4">
          <Skeleton className="skeleton-shimmer h-8 w-3/4" />
          <Skeleton className="skeleton-shimmer h-6 w-1/3" />
          <Skeleton className="skeleton-shimmer h-20 w-full" />
          <Skeleton className="skeleton-shimmer h-10 w-full" />
          <Skeleton className="skeleton-shimmer h-12 w-full" />
        </div>
      </div>
    </div>
  )
}

function NftDetailPage() {
  const { nftId } = Route.useParams()
  const navigate = useNavigate()
  const { data: nft, isLoading, isError, error } = useNftDetail(nftId)
  const { isAuthenticated } = useAuth()
  const { favoriteIds, toggle, isToggling } = useFavorites()
  const { addItem, cart } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState(0)
  const [activeEdition, setActiveEdition] = useState<string | null>(null)

  if (isError && error instanceof ApiError && error.status === 404) {
    throw notFound()
  }

  if (isLoading || !nft) {
    return <NftDetailSkeleton />
  }

  const isFavorited = favoriteIds.has(nft.id)
  const isSoldOut = nft.editionsAvailable <= 0
  const alreadyInCart = cart?.items.find((i) => i.nftId === nft.id)?.quantity ?? 0
  const maxAddable = Math.max(0, nft.editionsAvailable - alreadyInCart)

  function handleAddToCart() {
    if (!nft) return
    if (maxAddable <= 0) {
      toast.error("Limite de unidades atingido para este NFT.")
      return
    }
    addItem.mutate(
      { nftId: nft.id, quantity },
      {
        onSuccess: () => toast.success(`${nft.title} adicionado ao carrinho`),
        onError: (err) => {
          const message = err instanceof ApiError ? err.message : "Não foi possível adicionar ao carrinho."
          toast.error(message)
        },
      },
    )
  }

  // Token ID display (e.g. nft-042 → #042)
  const tokenId = `#${nftId.replace("nft-", "")}`
  // Simulated edition display matching Figma
  const editionTotal = nft.editionsTotal

  return (
    <>
      {/* ─────────────────────────────────────────────────────────── Desktop */}
      <div className="hidden lg:block">
        <div className="container-kurio py-10">
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="mb-10 flex gap-2 text-sm font-medium text-text-secondary"
          >
            <Link to="/" className="transition-colors hover:text-text-primary">
              Início
            </Link>
            <span>/</span>
            <Link to="/" className="transition-colors hover:text-text-primary">
              Mercado
            </Link>
          </nav>

          {/* Main 2-col grid */}
          <div className="grid gap-12 lg:grid-cols-[552px_1fr] lg:gap-24">
            {/* ── Left: Gallery ─────────────────────────────────────────── */}
            <div className="flex items-start gap-6">
              {/* Thumbnails */}
              <div className="flex flex-col gap-4">
                {nft.images.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    aria-label={`Ver imagem ${i + 1} de ${nft.title}`}
                    aria-current={activeImage === i}
                    className={cn(
                      "size-24 shrink-0 overflow-hidden rounded-xl border-2 transition-all aspect-square object-cover",
                      activeImage === i
                        ? "border-primary opacity-100"
                        : "border-border-soft/30 opacity-60 hover:opacity-90",
                    )}
                  >
                    <img src={img} alt="" className="size-full object-cover" />
                  </button>
                ))}
              </div>

              {/* Main image */}
              <div className="relative size-[444px] flex justify-center items-center shrink-0 overflow-hidden rounded-2xl bg-surface-card aspect-square">
                <img
                  src={nft.images[activeImage]}
                  alt={nft.title}
                  className="size-[404px] object-cover"
                  width={444}
                  height={444}
                />
                {/* Zoom icon — Figma shows a magnifier in top-right */}
                <button
                  type="button"
                  aria-label="Ampliar imagem"
                  onClick={outOfScopeToast}
                  className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-ink/70 text-text-primary/80 backdrop-blur transition-colors hover:bg-ink hover:text-text-primary"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </button>
              </div>
            </div>

            {/* ── Right: Info ────────────────────────────────────────────── */}
            <div className="flex flex-col pt-2">
              {/* Title */}
              <h1 className="font-heading text-2xl lg:text-3xl font-bold tracking-tight text-text-primary">
                {nft.title}
              </h1>

              {/* Price + Rating */}
              <div className="mt-4 flex items-center justify-between gap-6 border-b border-primary/30">
                <p className="font-mono text-2xl font-bold tabular-nums text-primary">
                  {formatEth(nft.priceEth)}
                </p>
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <span className="flex text-primary" aria-label="5 estrelas">
                    {"★★★★★".split("").map((star, i) => (
                      <span key={i} aria-hidden>
                        {star}
                      </span>
                    ))}
                  </span>
                  <span>19 avaliações de colecionadores</span>
                </div>
              </div>

              {/* Description */}
              <div className="mt-8 space-y-2">
                <h2 className="font-heading text-base font-bold text-text-primary">
                  Sobre este NFT:
                </h2>
                <p className="text-base leading-relaxed text-text-secondary">
                  {nft.description}
                </p>
              </div>

              {/* Edition row — matches Figma: "Edição: / 1/1  1/10  (1/50)  ABERTA" */}
              <div className="mt-8">
                <p className="mb-3 font-heading text-base font-bold text-text-primary">
                  Edição:
                </p>
                <div className="flex items-center gap-3 text-sm">
                  {[
                    "1/1",
                    `1/${Math.max(10, Math.floor(editionTotal / 2))}`,
                    `1/${editionTotal}`,
                    "ABERTA",
                  ].map((ed) => (
                    <button
                      key={ed}
                      type="button"
                      onClick={() => setActiveEdition(ed)}
                      className={cn(
                        "font-mono tabular-nums text-[13px] font-bold px-3 py-1 rounded-[100%] transition-colors uppercase",
                        (activeEdition || `1/${editionTotal}`) === ed
                          ? "border border-primary text-primary"
                          : "border border-primary/30 text-text-secondary hover:text-text-primary",
                      )}
                    >
                      {ed}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity + Actions row */}
              <div className="mt-8 flex items-center justify-between gap-4">
                {/* Quantity stepper — Figma: plain - / number / + without container pill */}
                <div
                  className="flex items-center gap-2"
                  role="group"
                  aria-label="Quantidade"
                >
                  <button
                    type="button"
                    aria-label="Diminuir quantidade"
                    disabled={quantity <= 1}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="flex w-8 h-13 items-center justify-center rounded-full bg-primary text-ink transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Minus className="size-5" strokeWidth={2.5} />
                  </button>
                  <span
                    className="w-10 text-center font-mono text-base font-bold tabular-nums text-text-primary"
                    aria-live="polite"
                    aria-label={`Quantidade: ${quantity}`}
                  >
                    {quantity}
                  </span>
                  <button
                    type="button"
                    aria-label="Aumentar quantidade"
                    disabled={quantity >= maxAddable}
                    onClick={() =>
                      setQuantity((q) => Math.min(maxAddable || 1, q + 1))
                    }
                    className="flex w-8 h-13 items-center justify-center rounded-full bg-primary text-ink transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Plus className="size-5" strokeWidth={2.5} />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {/* Buy button */}
                  <Button
                    className="h-10 w-32 rounded bg-primary font-heading text-sm font-bold uppercase tracking-wide text-ink hover:bg-primary/90 disabled:opacity-60"
                    disabled={isSoldOut || maxAddable <= 0 || addItem.isPending}
                    onClick={handleAddToCart}
                  >
                    {isSoldOut ? "Esgotado" : "Comprar"}
                  </Button>
                  {/* Favorite button */}
                  <Button
                    variant="outline"
                    className={cn(
                      "h-10 w-32 gap-2 rounded border-primary bg-transparent text-sm font-medium text-text-accent hover:border-primary/60",
                      isFavorited && "border-primary/40 text-primary",
                    )}
                    disabled={!isAuthenticated || isToggling}
                    onClick={() => toggle(nft)}
                    aria-pressed={isFavorited}
                  >
                    <Heart
                      className={cn(
                        "size-4",
                        isFavorited && "fill-primary text-primary",
                      )}
                    />
                    Favoritar
                  </Button>
                </div>
              </div>

              {/* Metadata */}
              <div className="mt-8 space-y-2 text-sm text-text-secondary">
                <p>
                  <span className="font-heading font-bold">ID do token:</span>{" "}
                  <span className="font-mono tabular-nums">{tokenId}</span>
                </p>
                <p>
                  <span className="font-heading font-bold">Coleção:</span>{" "}
                  {nft.collection}
                </p>
                <p>
                  <span className="font-heading font-bold">Atributos:</span>{" "}
                  {nft.attributes.map((a) => a.value).join(", ")}
                </p>
                <div className="flex items-center gap-2 pt-2 text-foreground-color">
                  <span className="font-heading font-bold">
                    Compartilhar este NFT:
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={outOfScopeToast}
                      aria-label="Compartilhar no LinkedIn"
                      className="rounded p-0.5 text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {/* LinkedIn icon */}
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden
                      >
                        <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z" />
                        <rect x="2" y="9" width="4" height="12" />
                        <circle cx="4" cy="4" r="2" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={outOfScopeToast}
                      aria-label="Compartilhar no email"
                      className="rounded p-0.5 text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {/* Email icon */}
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                      >
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={outOfScopeToast}
                      aria-label="Compartilhar no X (Twitter)"
                      className="rounded p-0.5 text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {/* X icon */}
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden
                      >
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.259 5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Tabs: Detalhes + Avaliações ─────────────────────────────── */}
          <div className="mt-24">
            <div
              className="flex gap-10 border-b border-border-soft/40"
              role="tablist"
              aria-label="Seções do NFT"
            >
              <button
                type="button"
                role="tab"
                aria-selected="true"
                className="relative pb-4 font-heading text-base font-bold text-primary after:absolute after:-bottom-[1px] after:left-0 after:h-[2px] after:w-full after:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Detalhes do NFT
              </button>
              <button
                type="button"
                role="tab"
                aria-selected="false"
                className="pb-4 font-heading text-base font-semibold text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                onClick={outOfScopeToast}
              >
                Avaliações de colecionadores (19)
              </button>
            </div>

            {/* Tab content — Figma: 1-column layout with text + 3 metadata blocks below */}
            <div className="mt-10 text-base leading-relaxed text-text-secondary max-w-4xl">
              <p>
                {nft.title} é uma obra digital 1/{editionTotal} finalizada à mão
                da coleção {nft.collection}. Cada atributo fica armazenado nos
                metadados do token e verificado na{" "}
                {nft.category === "art" ? "Ethereum" : "Polygon"}. A obra
                explora identidade, movimento e luz em um mundo digital sem
                fronteiras.
              </p>
              <p className="mt-4">
                A propriedade inclui a arte em alta resolução, lançamentos
                exclusivos para colecionadores e um registro permanente de
                procedência registrada na rede. {nft.creator.name} recebe 5% de
                direitos autorais nas vendas secundárias, apoiando novos
                trabalhos e lançamentos da comunidade.
              </p>

              <div className="mt-8 space-y-6">
                <div>
                  <p className="font-heading font-bold text-text-primary">
                    Rede:
                  </p>
                  <p className="mt-1.5">
                    Cunhado na {nft.category === "art" ? "Ethereum" : "Polygon"}{" "}
                    com procedência imutável e metadados armazenados no IPFS.
                  </p>
                </div>
                <div>
                  <p className="font-heading font-bold text-text-primary">
                    Contrato:
                  </p>
                  <p className="mt-1.5">
                    Direitos autorais do criador: 5% nas vendas secundárias,
                    pagos automaticamente pelos mercados compatíveis.
                  </p>
                </div>
                <div>
                  <p className="font-heading font-bold text-text-primary">
                    Direitos autorais:
                  </p>
                  <p className="mt-1.5 font-mono tabular-nums text-text-secondary">
                    0x7A42...19E8 • Contrato inteligente ERC-721 verificado.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── "Mais desta coleção" carousel ───────────────────────────── */}
          <MoreFromCollection currentId={nft.id} />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── Mobile */}

      {/* Global style para empurrar o body inteiro (incluindo o Footer) e não ficar oculto pelo painel fixo no mobile */}
      <style>{`
        @media (max-width: 767px) {
          body {
            padding-bottom: 60px;
          }
        }
      `}</style>

      <div className="lg:hidden">
        {/* Mobile Header (Back + Favorite) */}
        <div className="flex items-center justify-between p-4 md:hidden">
          <button
            type="button"
            aria-label="Voltar"
            onClick={() => navigate({ to: "/" })}
            className="flex size-11 items-center justify-center rounded-full bg-surface-raised border border-border text-secondary transition-colors active:bg-ink"
          >
            <ArrowLeft className="size-5" />
          </button>
          <button
            type="button"
            aria-label={
              isFavorited
                ? `Remover ${nft.title} dos favoritos`
                : `Favoritar ${nft.title}`
            }
            aria-pressed={isFavorited}
            disabled={!isAuthenticated || isToggling}
            onClick={() => toggle(nft)}
            className={cn(
              "flex size-11 items-center justify-center rounded-full bg-surface-raised border border-border transition-colors active:bg-ink",
              isFavorited ? "text-primary" : "text-secondary",
            )}
          >
            <Heart className={cn("size-5", isFavorited && "fill-primary")} />
          </button>
        </div>

        {/* Hero image — aspect-square with margin on mobile */}
        <div className="px-4 md:px-0">
          <div className="aspect-square w-full overflow-hidden rounded-[24px] md:rounded-none bg-surface-dark">
            <img
              src={nft.images[activeImage]}
              alt={nft.title}
              className="size-full object-cover"
              width={800}
              height={800}
            />
          </div>
        </div>

        {/* Thumbnails strip */}
        {nft.images.length > 1 && (
          <div
            className="hidden md:flex gap-2 overflow-x-auto px-4 py-3"
            aria-label="Galeria de imagens"
          >
            {nft.images.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveImage(i)}
                aria-label={`Ver imagem ${i + 1}`}
                aria-current={activeImage === i}
                className={cn(
                  "size-14 shrink-0 overflow-hidden rounded-lg border-2 transition-all",
                  activeImage === i
                    ? "border-primary"
                    : "border-border-soft/30 opacity-60",
                )}
              >
                <img src={img} alt="" className="size-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Info card */}
        <div className="px-4 pt-4" style={{ paddingBottom: "7rem" }}>
          {/* Title + Rating pill */}
          <div className="flex items-start justify-between gap-3">
            <h1 className="font-heading text-xl font-bold text-text-primary">
              {nft.title}
            </h1>
            <div className="flex shrink-0 items-center gap-1 rounded-full border border-primary px-2.5 py-1">
              <span className="text-[11px] text-primary">★</span>
              <span className="font-mono text-[11px] font-bold tabular-nums text-text-primary">
                4.8<span className="text-text-secondary font-normal">(19)</span>
              </span>
            </div>
          </div>

          {/* Description — shorter on mobile */}
          <p className="mt-3 text-sm leading-relaxed text-text-secondary">
            {nft.description.length > 120
              ? `${nft.description.slice(0, 120)}…`
              : nft.description}
          </p>

          {/* Edition */}
          <div className="mt-4">
            <p className="mb-2 font-heading text-sm font-bold text-text-primary">
              Edição:
            </p>
            <div className="flex items-center gap-2 text-sm">
              {[
                "1/1",
                `1/${Math.max(10, Math.floor(editionTotal / 2))}`,
                `1/${editionTotal}`,
                "ABERTA",
              ].map((ed) => (
                <button
                  key={ed}
                  type="button"
                  onClick={() => setActiveEdition(ed)}
                  className={cn(
                    "font-mono tabular-nums text-[11px] font-bold px-2.5 py-0.5 rounded-[100%] transition-colors uppercase",
                    (activeEdition || `1/${editionTotal}`) === ed
                      ? "border border-primary text-primary"
                      : "border border-border text-text-secondary hover:text-text-primary",
                  )}
                >
                  {ed}
                </button>
              ))}
            </div>
          </div>

          {/* Metadata list */}
          <div className="mt-4 space-y-2 text-sm text-text-secondary">
            <p>
              <span className="font-heading">ID do token:</span>{" "}
              <span className="font-mono tabular-nums">{tokenId}</span>
            </p>
            <p>
              <span className="font-heading">Coleção:</span> {nft.collection}
            </p>
            <p>
              <span className="font-heading">Atributos:</span>{" "}
              {nft.attributes.map((a) => a.value).join(", ")}
            </p>
            <div className="pt-2">
              <span className="font-heading font-bold text-text-primary block mb-1">
                Rede:
              </span>
              <p className="text-xs">
                Cunhado na {nft.category === "art" ? "Ethereum" : "Polygon"} com
                procedência imutável e metadados no IPFS.
              </p>
            </div>
            <div>
              <span className="font-heading font-bold text-text-primary block mb-1">
                Contrato:
              </span>
              <p className="text-xs">
                Direitos autorais do criador: 5% nas vendas secundárias.
              </p>
            </div>
            <div>
              <span className="font-heading font-bold text-text-primary block mb-1">
                Direitos autorais:
              </span>
              <p className="font-mono tabular-nums text-xs">
                0x7A42...19E8 • Contrato ERC-721 verificado.
              </p>
            </div>
          </div>
        </div>

        {/* ── Fixed bottom bar: Qtd. - 1 + | ETH | Comprar NFT | 🛒 ──── */}
        <div className="fixed inset-x-0 bottom-0 z-40 bg-surface-card px-6 pt-5 pb-9 rounded-t-4xl backdrop-blur md:relative md:border-none md:bg-transparent">
          {/* Line 1: Qtd + Price */}
          <div className="mb-4 flex items-center justify-between">
            {/* Label + stepper */}
            <div className="flex items-center gap-3">
              <span className="font-heading text-sm font-bold text-text-primary">
                Qtd.
              </span>
              <button
                type="button"
                aria-label="Diminuir quantidade"
                disabled={quantity <= 1}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex w-5 h-8 items-center justify-center rounded-full bg-primary text-ink transition-opacity disabled:opacity-40"
              >
                <Minus className="size-4" strokeWidth={2.5} />
              </button>
              <span
                className="w-4 text-center font-mono text-base font-bold tabular-nums text-text-primary"
                aria-live="polite"
              >
                {quantity}
              </span>
              <button
                type="button"
                aria-label="Aumentar quantidade"
                disabled={quantity >= maxAddable}
                onClick={() =>
                  setQuantity((q) => Math.min(maxAddable || 1, q + 1))
                }
                className="flex w-5 h-8 items-center justify-center rounded-full bg-primary text-ink transition-opacity disabled:opacity-40"
              >
                <Plus className="size-4" strokeWidth={2.5} />
              </button>
            </div>

            {/* Price */}
            <p className="font-mono text-xl font-bold tabular-nums text-primary">
              {formatEth(nft.priceEth)}
            </p>
          </div>

          {/* Line 2: Buy + Cart */}
          <div className="flex items-center gap-3">
            <Button
              className="h-15 rounded-full px-11 bg-primary font-heading text-base font-bold capitalize text-ink hover:bg-primary/90 disabled:opacity-60"
              disabled={isSoldOut || maxAddable <= 0 || addItem.isPending}
              onClick={handleAddToCart}
            >
              {isSoldOut ? "Esgotado" : "Comprar NFT"}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-15 shrink-0 rounded-full border-border bg-surface-raised text-secondary"
              aria-label="Ver carrinho"
              asChild
            >
              <Link to="/cart">
                <ShoppingCart className="size-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

/** "Mais desta coleção" — 5-card horizontal carousel (desktop only) */
function MoreFromCollection({ currentId }: { currentId: string }) {
  // Static placeholder cards using the same NFT images available in the mock
  // In a real implementation this would be a query filtered by collection
  const placeholderNfts = [
    { id: "nft-002", title: "Sage Nomad #009", price: "1.69 ETH", img: "/assets/nft/nft-002.svg" },
    { id: "nft-003", title: "Neon Vessel #552", price: "1.99 ETH", img: "/assets/nft/nft-003.svg" },
    { id: "nft-004", title: "Cosmic Bloom #118", price: "1.29 ETH", img: "/assets/nft/nft-004.svg" },
    { id: "nft-001b", title: "Violet Nomad #314", price: "1.39 ETH", img: "/assets/nft/nft-001.svg" },
    { id: "nft-002b", title: "Golden Beat #207", price: "0.99 ETH", img: "/assets/nft/nft-002.svg" },
  ].filter((n) => !n.id.startsWith(currentId.split("-").slice(0, 2).join("-")))

  return (
    <div className="mt-24">
      <div className="mb-8 flex items-center justify-between border-b border-border-soft/40 pb-4">
        <h2 className="font-heading text-lg font-bold text-primary">Mais desta coleção</h2>
      </div>

      <div className="grid grid-cols-5 gap-6">
        {placeholderNfts.map((item) => (
          <Link
            key={item.id}
            to="/nfts/$nftId"
            params={{ nftId: item.id }}
            className="group flex flex-col"
          >
            <div className="aspect-square overflow-hidden rounded-xl bg-surface-dark">
              <img
                src={item.img}
                alt={item.title}
                className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="pt-2">
              <p className="truncate font-heading text-xs font-medium text-text-primary">{item.title}</p>
              <p className="mt-0.5 font-mono text-xs font-bold tabular-nums text-primary">{item.price}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Carousel dots */}
      <div className="mt-5 flex justify-center gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn(
              "block size-2 rounded-full transition-colors",
              i === 1 ? "bg-primary" : "bg-text-primary/20",
            )}
          />
        ))}
      </div>
    </div>
  )
}
