import { Link } from "@tanstack/react-router"
import { Heart } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/features/auth/auth-context"
import { useFavorites } from "@/features/favorites/use-favorites"
import { formatEth } from "@/lib/money"
import { cn } from "@/lib/utils"
import type { Nft } from "@/types/domain"

export function NftCard({ nft }: { nft: Nft }) {
  const { isAuthenticated } = useAuth()
  const { favoriteIds, toggle, isToggling } = useFavorites()
  const isFavorited = favoriteIds.has(nft.id)
  const isSoldOut = nft.editionsAvailable <= 0

  return (
    <Link
      to="/nfts/$nftId"
      params={{ nftId: nft.id }}
      className="group flex flex-col overflow-visible bg-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
        <img
          src={nft.coverImage}
          alt={nft.title}
          width={640}
          height={640}
          loading="lazy"
          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {nft.isNew && <Badge className="bg-success text-success-foreground">Novo</Badge>}
          {nft.trending && <Badge className="rounded-none bg-primary px-3 py-2 text-[10px] font-medium text-primary-foreground">RARO</Badge>}
          {isSoldOut && <Badge variant="secondary">Esgotado</Badge>}
        </div>
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className={cn(
            "absolute right-2 top-2 size-7 rounded-full bg-background/80 backdrop-blur hover:bg-background",
            isFavorited && "text-primary",
          )}
          aria-pressed={isFavorited}
          aria-label={isFavorited ? `Remover ${nft.title} dos favoritos` : `Adicionar ${nft.title} aos favoritos`}
          disabled={isToggling}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (!isAuthenticated) return
            toggle(nft)
          }}
        >
          <Heart className={cn("size-4", isFavorited && "fill-current")} />
        </Button>
      </div>

      <div className="flex flex-1 flex-col gap-0 pt-2">
        <div className="hidden items-center gap-1.5 text-xs text-muted-foreground">
          <img src={nft.creator.avatarUrl} alt="" className="size-4 rounded-full" />
          <span className="truncate">{nft.creator.name}</span>
        </div>
        <h3 className="truncate font-heading text-xs font-medium text-foreground" title={nft.title}>
          {nft.title}
        </h3>
        <div className="mt-0 flex items-end justify-between pt-0.5">
          <div className="flex items-center gap-1.5">
            <p className="font-heading text-xs font-bold text-primary">{formatEth(nft.priceEth)}</p>
            {nft.lastSalePriceEth && nft.lastSalePriceEth !== nft.priceEth && (
              <p className="font-heading text-xs text-muted-foreground line-through">{formatEth(nft.lastSalePriceEth)}</p>
            )}
          </div>
          <p className="hidden text-[11px] text-muted-foreground">
            {nft.editionsAvailable}/{nft.editionsTotal} disp.
          </p>
        </div>
      </div>
    </Link>
  )
}
