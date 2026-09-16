import { useState } from "react"
import type { NftCategory } from "@/types/domain"
import { getNftCategoryLabel } from "@/lib/nfts/categories"
import { cn } from "@/lib/utils"

interface CategoryOption {
  value: NftCategory | "all"
  label: string
  count: number
}

const NETWORK_OPTIONS = [
  { value: "ethereum", label: "Ethereum", count: 119 },
  { value: "polygon", label: "Polygon", count: 78 },
  { value: "solana", label: "Solana", count: 86 },
] as const

const PRICE_MIN = 0
const PRICE_MAX = 20
const PRICE_STEP = 0.01

export function CategorySidebar({
  options,
  active,
  onChange,
}: {
  options: CategoryOption[]
  active: string
  onChange: (value: NftCategory | "all") => void
}) {
  const [priceRange, setPriceRange] = useState<[number, number]>([0.02, 12.3])
  const [activeNetworks, setActiveNetworks] = useState<Set<string>>(new Set())

  function toggleNetwork(value: string) {
    setActiveNetworks((prev) => {
      const next = new Set(prev)
      if (next.has(value)) {
        next.delete(value)
      } else {
        next.add(value)
      }
      return next
    })
  }

  // Percentage positions for the range track
  const minPct = ((priceRange[0] - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100
  const maxPct = ((priceRange[1] - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100

  return (
    <div className="space-y-6">
      {/* ── Coleções ─────────────────────────────────────────────────────── */}
      <nav aria-label="Filtrar por categoria" className="space-y-1">
        <h2 className="mb-3 px-2 font-heading text-base font-semibold text-text-primary">Coleções</h2>
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
                : "text-text-secondary hover:bg-surface-dark hover:text-text-primary",
            )}
          >
            <span>{opt.label}</span>
            <span className={cn("text-xs tabular-nums", active === opt.value ? "text-primary" : "text-text-secondary")}>
              ({opt.count})
            </span>
          </button>
        ))}
      </nav>

      {/* ── Faixa de preço ───────────────────────────────────────────────── */}
      <div>
        <h2 className="mb-4 px-2 font-heading text-base font-semibold text-text-primary">Faixa de preço</h2>

        {/* Dual-thumb range slider — visual only, matching Figma layout */}
        <div className="relative px-2 pb-4" role="group" aria-label="Faixa de preço em ETH">
          {/* Track */}
          <div className="relative h-1.5 w-full rounded-full bg-surface-dark">
            {/* Filled range */}
            <div
              className="absolute h-full rounded-full bg-primary"
              style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }}
              aria-hidden
            />
          </div>

          {/* Min thumb */}
          <input
            type="range"
            min={PRICE_MIN}
            max={PRICE_MAX}
            step={PRICE_STEP}
            value={priceRange[0]}
            aria-label="Preço mínimo em ETH"
            onChange={(e) => {
              const v = parseFloat(e.target.value)
              if (v < priceRange[1]) setPriceRange([v, priceRange[1]])
            }}
            className="pointer-events-none absolute inset-x-2 top-0 h-1.5 w-[calc(100%-1rem)] cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:ring-2 [&::-webkit-slider-thumb]:ring-primary/40"
          />

          {/* Max thumb */}
          <input
            type="range"
            min={PRICE_MIN}
            max={PRICE_MAX}
            step={PRICE_STEP}
            value={priceRange[1]}
            aria-label="Preço máximo em ETH"
            onChange={(e) => {
              const v = parseFloat(e.target.value)
              if (v > priceRange[0]) setPriceRange([priceRange[0], v])
            }}
            className="pointer-events-none absolute inset-x-2 top-0 h-1.5 w-[calc(100%-1rem)] cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:ring-2 [&::-webkit-slider-thumb]:ring-primary/40"
          />

          {/* Price display */}
          <p className="mt-4 font-mono text-xs tabular-nums text-text-secondary">
            Preço:{" "}
            <span className="text-text-primary">
              {priceRange[0].toFixed(2)} – {priceRange[1].toFixed(2)} ETH
            </span>
          </p>
        </div>

        {/* Apply button */}
        <button
          type="button"
          className="ml-2 mt-1 rounded-md bg-primary px-4 py-1.5 font-heading text-xs font-semibold uppercase text-ink transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Aplicar
        </button>
      </div>

      {/* ── Rede ─────────────────────────────────────────────────────────── */}
      <div>
        <h2 className="mb-3 px-2 font-heading text-base font-semibold text-text-primary">Rede</h2>
        <div className="space-y-1">
          {NETWORK_OPTIONS.map((net) => {
            const checked = activeNetworks.has(net.value)
            return (
              <button
                key={net.value}
                type="button"
                role="checkbox"
                aria-checked={checked}
                onClick={() => toggleNetwork(net.value)}
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm transition-colors",
                  checked
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-text-secondary hover:bg-surface-dark hover:text-text-primary",
                )}
              >
                <span>{net.label}</span>
                <span className={cn("text-xs tabular-nums", checked ? "text-primary" : "text-text-secondary")}>
                  ({net.count})
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
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
