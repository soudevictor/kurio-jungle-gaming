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
    <div className="container-kurio py-10">
      <nav aria-label="Breadcrumb" className="mb-8 flex gap-2 text-sm font-medium text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Início</Link>
        <span>/</span>
        <Link to="/" className="hover:text-foreground">Mercado</Link>
      </nav>

      <div className="grid gap-12 lg:grid-cols-2">
        {/* Left Column: Gallery */}
        <div className="flex gap-6">
          <div className="flex flex-col gap-4">
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
