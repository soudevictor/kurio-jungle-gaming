import { z } from "zod"

/**
 * Catalog filter/sort/pagination state lives entirely in the URL (README
 * §"Catálogo e detalhe": "deve compor o estado da URL e sobreviver a refresh
 * e navegação pelo histórico"). This schema is the single source of truth
 * for parsing + defaults on both the route (`validateSearch`) and the
 * `useNftList` query key.
 */
export const catalogSearchSchema = z.object({
  search: z.string().trim().min(1).optional().catch(undefined),
  category: z
    .enum(["all", "art", "photography", "music", "3d", "collectibles", "generative", "gaming", "subscriptions", "utility", "sports"])
    .catch("all")
    .default("all"),
  sort: z.enum(["relevance", "price-asc", "price-desc", "recent", "trending"]).catch("relevance").default("relevance"),
  page: z.number().int().min(1).catch(1).default(1),
})

export type CatalogSearch = z.infer<typeof catalogSearchSchema>
