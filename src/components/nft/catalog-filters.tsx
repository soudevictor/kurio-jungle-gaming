import type { NftCategory } from "@/types/domain"
import { getNftCategoryLabel } from "@/lib/nfts/categories"
import { cn } from "@/lib/utils"

interface CategoryOption {
  value: NftCategory | "all"
  label: string
  count: number
}

export function CategorySidebar({
  options,
  active,
  onChange,
}: {
  options: CategoryOption[]
  active: string
  onChange: (value: NftCategory | "all") => void
}) {
  return (
    <nav aria-label="Filtrar por categoria" className="space-y-1">
      <h2 className="mb-3 px-2 font-heading text-base font-semibold text-foreground">Coleções</h2>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          aria-pressed={active === opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm transition-colors",
            active === opt.value
              ? "bg-primary/10 font-medium text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <span>{opt.label}</span>
          <span className={cn("text-xs tabular-nums", active === opt.value ? "text-primary" : "text-muted-foreground")}>
            ({opt.count})
          </span>
        </button>
      ))}
    </nav>
  )
}

export const CATEGORY_OPTIONS: Array<NftCategory | "all"> = [
  "all",
  "art",
  "photography",
  "music",
  "3d",
  "collectibles",
  "generative",
  "gaming",
  "subscriptions",
  "utility",
]

export function categoryLabel(value: NftCategory | "all") {
  return getNftCategoryLabel(value)
}
