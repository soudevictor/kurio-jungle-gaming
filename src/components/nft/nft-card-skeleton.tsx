import { Skeleton } from "@/components/ui/skeleton"

/** Mirrors NftCard's exact box model so swapping skeleton → real card causes
 * zero layout shift (README §8: "Preserve as dimensões do conteúdo"). */
export function NftCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card" aria-hidden>
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="flex flex-col gap-2 p-3">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-16" />
        <div className="mt-1 flex items-end justify-between">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
    </div>
  )
}

export function NftGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
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
