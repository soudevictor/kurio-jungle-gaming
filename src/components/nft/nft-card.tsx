import { Link } from "@tanstack/react-router"
import { Badge } from "@/components/ui/badge"
import { formatEth } from "@/lib/money"
import type { Nft } from "@/types/domain"

export function NftCard({ nft }: { nft: Nft }) {

  return (
    <Link
      to="/nfts/$nftId"
      params={{ nftId: nft.id }}
      className="group flex flex-col overflow-visible bg-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="relative aspect-square rounded-xl bg-surface-dark">
        <img
          src={nft.coverImage}
          alt={nft.title}
          width={640}
          height={640}
          loading="lazy"
          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute left-0 top-0 flex flex-wrap gap-1">
          {nft.trending && <Badge className="scale-125 rounded-none bg-primary px-2.5 py-1 text-[10px] font-bold uppercase text-ink">RARO</Badge>}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-0 pt-2">
        <div className="hidden items-center gap-1.5 text-xs text-text-secondary">
          <img src={nft.creator.avatarUrl} alt="" className="size-4 rounded-full" />
          <span className="truncate">{nft.creator.name}</span>
        </div>
        <h3 className="truncate font-heading text-base font-medium text-text-primary" title={nft.title}>
          {nft.title}
        </h3>
        <div className="mt-0 flex items-end justify-between pt-0.5">
          <div className="flex items-center gap-3">
            <p className="font-mono text-base md:text-lg font-bold tabular-nums text-primary">{formatEth(nft.priceEth)}</p>
            {nft.lastSalePriceEth && nft.lastSalePriceEth !== nft.priceEth && (
              <p className="font-mono text-base md:text-lg font-normal tabular-nums text-text-secondary">{formatEth(nft.lastSalePriceEth)}</p>
            )}
          </div>
          <p className="hidden text-[11px] text-text-secondary">
            {nft.editionsAvailable}/{nft.editionsTotal} disp.
          </p>
        </div>
      </div>
    </Link>
  )
}
