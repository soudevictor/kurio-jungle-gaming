import { createFileRoute, Link, notFound } from "@tanstack/react-router"
import { Heart, Minus, Plus } from "lucide-react"
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
      <p className="mt-2 text-muted-foreground">Este item não existe ou foi removido do catálogo.</p>
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

function NftDetailPage() {
  const { nftId } = Route.useParams()
  const { data: nft, isLoading, isError, error } = useNftDetail(nftId)
  const { isAuthenticated } = useAuth()
  const { favoriteIds, toggle, isToggling } = useFavorites()
  const { addItem, cart } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState(0)

  if (isError && error instanceof ApiError && error.status === 404) {
    throw notFound()
  }

  if (isLoading || !nft) {
    return (
      <div className="container-kurio py-10">
        <Skeleton className="mb-6 h-5 w-40" />
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="flex gap-4">
            <div className="flex flex-col gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="size-20 rounded-lg" />
              ))}
            </div>
            <Skeleton className="aspect-square w-full flex-1 rounded-2xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    )
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
                aria-label={`Ver imagem ${i + 1} de ${nft.title}`}
                aria-current={activeImage === i}
                className={cn(
                  "size-20 overflow-hidden rounded-lg border-2 transition-colors",
                  activeImage === i ? "border-primary" : "border-transparent opacity-70 hover:opacity-100",
                )}
              >
                <img src={img} alt="" className="size-full object-cover" />
              </button>
            ))}
          </div>
          <div className="aspect-square flex-1 overflow-hidden rounded-2xl border border-border/40 bg-muted">
            <img src={nft.images[activeImage]} alt={nft.title} className="size-full object-cover" />
          </div>
        </div>

        {/* Right Column: Details */}
        <div className="flex flex-col">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">{nft.title}</h1>
          
          <div className="mt-4 flex items-center gap-6">
            <p className="font-heading text-2xl font-bold text-primary">{formatEth(nft.priceEth)}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex text-primary">
                {"★★★★★".split("").map((star, i) => (
                  <span key={i}>{star}</span>
                ))}
              </div>
              <span>19 avaliações de colecionadores</span>
            </div>
          </div>

          <div className="mt-8 space-y-2">
            <h3 className="font-heading text-sm font-bold text-foreground">Sobre este NFT:</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{nft.description}</p>
          </div>

          <div className="mt-6 flex items-center gap-2 text-sm">
            <span className="font-heading font-bold text-foreground">Edição:</span>
            <span className="text-muted-foreground">{nft.editionsAvailable}/{nft.editionsTotal}</span>
            <span className="text-[10px] font-bold uppercase text-primary border border-primary px-1.5 py-0.5 rounded ml-1">Aberta</span>
          </div>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex h-12 items-center rounded-full bg-background/50 px-2 border border-border/60">
              <button
                type="button"
                className="flex size-8 items-center justify-center rounded-full bg-primary/20 text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
                disabled={quantity <= 1}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <Minus className="size-4" strokeWidth={3} />
              </button>
              <span className="w-12 text-center text-sm font-bold text-foreground" aria-live="polite">
                {quantity}
              </span>
              <button
                type="button"
                className="flex size-8 items-center justify-center rounded-full bg-primary/20 text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
                disabled={quantity >= maxAddable}
                onClick={() => setQuantity((q) => Math.min(maxAddable || 1, q + 1))}
              >
                <Plus className="size-4" strokeWidth={3} />
              </button>
            </div>

            <Button className="h-12 w-48 bg-primary font-bold text-primary-foreground hover:bg-primary/90" disabled={isSoldOut || maxAddable <= 0 || addItem.isPending} onClick={handleAddToCart}>
              {isSoldOut ? "ESGOTADO" : "COMPRAR"}
            </Button>

            <Button
              variant="outline"
              className="h-12 border-border/60 bg-transparent gap-2 hover:border-primary/50"
              disabled={!isAuthenticated || isToggling}
              onClick={() => toggle(nft)}
            >
              <Heart className={cn("size-4", isFavorited && "fill-primary text-primary")} />
              Favoritar
            </Button>
          </div>

          <div className="mt-8 space-y-2 text-sm text-muted-foreground">
            <p><span className="font-medium text-foreground">ID do token:</span> #{nftId.split("-")[1] || "000"}</p>
            <p><span className="font-medium text-foreground">Coleção:</span> {nft.collection}</p>
            <p><span className="font-medium text-foreground">Atributos:</span> {nft.attributes.map(a => a.value).join(", ")}</p>
            <div className="flex items-center gap-2 pt-2">
              <span className="font-medium text-foreground">Compartilhar este NFT:</span>
              <div className="flex gap-2">
                <button type="button" onClick={outOfScopeToast} className="hover:text-primary transition-colors">in</button>
                <button type="button" onClick={outOfScopeToast} className="hover:text-primary transition-colors">𝕏</button>
                <button type="button" onClick={outOfScopeToast} className="hover:text-primary transition-colors">♡</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-16">
        <div className="flex gap-6 border-b border-border/40 pb-3 text-sm font-heading">
          <span className="font-bold text-primary relative after:absolute after:bottom-[-13px] after:left-0 after:w-full after:h-0.5 after:bg-primary">
            Detalhes do NFT
          </span>
          <span className="font-semibold text-muted-foreground hover:text-foreground cursor-pointer" onClick={outOfScopeToast}>
            Avaliações de colecionadores (19)
          </span>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-2 text-sm text-muted-foreground leading-relaxed">
          <p>
            {nft.title} é uma obra digital {nft.editionsAvailable}/{nft.editionsTotal} finalizada à mão da coleção {nft.collection}. Cada atributo fica armazenado nos metadados do token e verificado na {nft.category === "art" ? "Ethereum" : "Polygon"}. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.
            <br /><br />
            A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência registrada na rede. O criador {nft.creator.name} recebe 5% de direitos autorais nas vendas secundárias, apoiando novos trabalhos e lançamentos da comunidade.
          </p>
          <div className="space-y-4">
            <div>
              <p className="font-medium text-foreground">Rede:</p>
              <p>Cunhado na {nft.category === "art" ? "Ethereum" : "Polygon"} com procedência imutável e metadados armazenados no IPFS.</p>
            </div>
            <div>
              <p className="font-medium text-foreground">Contrato:</p>
              <p>Direitos autorais do criador: 5% nas vendas secundárias, pagos automaticamente pelos mercados compatíveis.</p>
            </div>
            <div>
              <p className="font-medium text-foreground">Direitos autorais:</p>
              <p>0x7442...19E8 - Contrato inteligente ERC-721 verificado.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
