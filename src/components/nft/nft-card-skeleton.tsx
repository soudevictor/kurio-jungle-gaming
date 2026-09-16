import { Skeleton } from "@/components/ui/skeleton"

/**
 * Mirrors NftCard's exact box model so swapping skeleton → real card causes
 * zero layout shift (specs.md §8: "Preserve as dimensões do conteúdo").
 * No border/bg-surface-card-card here — NftCard itself is borderless/transparent.
 */
export function NftCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden" aria-hidden>
      {/* aspect-square image area — matches NftCard's rounded-xl image container */}
      <Skeleton className="skeleton-shimmer aspect-square w-full rounded-xl" />
      <div className="flex flex-col gap-1.5 pt-2">
        {/* NFT name — matches h3 text-sm */}
        <Skeleton className="skeleton-shimmer h-4 w-3/4" />
        {/* Price row */}
        <div className="flex items-center gap-2">
          <Skeleton className="skeleton-shimmer h-4 w-16" />
          <Skeleton className="skeleton-shimmer h-3 w-12 opacity-60" />
        </div>
      </div>
    </div>
  )
}

export function NftGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 gap-x-5 gap-y-6 sm:grid-cols-3 lg:gap-x-6 lg:gap-y-8"
      role="status"
      aria-label="Carregando NFTs"
    >
      {Array.from({ length: count }).map((_, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <NftCardSkeleton key={i} />
      ))}
    </div>
  )
}
