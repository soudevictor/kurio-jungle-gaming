import { http, HttpResponse } from "msw"
import type { Nft, NftCategory, NftListResult } from "@/types/domain"
import { db } from "../db"
import { isEmptyCatalogScenario } from "../scenarios"
import { Errors, withScenario } from "./helpers"

function emptyCounts(): Record<NftCategory, number> {
  return {
    art: 0,
    photography: 0,
    music: 0,
    "3d": 0,
    collectibles: 0,
    generative: 0,
    gaming: 0,
    subscriptions: 0,
    utility: 0,
    sports: 0,
  }
}

function sortNfts(nfts: Nft[], sort: string | null): Nft[] {
  const copy = [...nfts]
  switch (sort) {
    case "price-asc":
      return copy.sort((a, b) => Number.parseFloat(a.priceEth) - Number.parseFloat(b.priceEth))
    case "price-desc":
      return copy.sort((a, b) => Number.parseFloat(b.priceEth) - Number.parseFloat(a.priceEth))
    case "recent":
      return copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    case "trending":
      return copy.sort((a, b) => Number(b.trending) - Number(a.trending) || b.likes - a.likes)
    case "relevance":
    default:
      return copy.sort((a, b) => b.likes - a.likes)
  }
}

export const nftHandlers = [
  http.get("/api/nfts", async ({ request }) =>
    withScenario(async () => {
      const url = new URL(request.url)
      const search = url.searchParams.get("search")?.trim().toLowerCase()
      const category = url.searchParams.get("category") as NftCategory | "all" | null
      const sort = url.searchParams.get("sort")
      const minPrice = url.searchParams.get("minPrice")
      const maxPrice = url.searchParams.get("maxPrice")
      const page = Math.max(1, Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1)
      const pageSize = Math.min(48, Math.max(1, Number.parseInt(url.searchParams.get("pageSize") ?? "12", 10) || 12))

      if (isEmptyCatalogScenario()) {
        const empty: NftListResult = {
          items: [],
          page: 1,
          pageSize,
          total: 0,
          totalPages: 0,
          categoryCounts: emptyCounts(),
        }
        return HttpResponse.json(empty)
      }

      let matchingSearch = db.listNfts()
      if (search) {
        matchingSearch = matchingSearch.filter(
          (n) =>
            n.title.toLowerCase().includes(search) ||
            n.collection.toLowerCase().includes(search) ||
            n.creator.name.toLowerCase().includes(search) ||
            n.tags.some((t) => t.toLowerCase().includes(search)),
        )
      }
      if (minPrice) matchingSearch = matchingSearch.filter((n) => Number.parseFloat(n.priceEth) >= Number.parseFloat(minPrice))
      if (maxPrice) matchingSearch = matchingSearch.filter((n) => Number.parseFloat(n.priceEth) <= Number.parseFloat(maxPrice))

      const categoryCounts = emptyCounts()
      for (const n of matchingSearch) categoryCounts[n.category] += 1

      let items = matchingSearch
      if (category && category !== "all") {
        items = items.filter((n) => n.category === category)
      }
      items = sortNfts(items, sort)

      const total = items.length
      const totalPages = Math.max(1, Math.ceil(total / pageSize))
      const start = (page - 1) * pageSize
      const paged = items.slice(start, start + pageSize)

      const result: NftListResult = { items: paged, page, pageSize, total, totalPages, categoryCounts }
      return HttpResponse.json(result)
    }),
  ),

  http.get("/api/nfts/:id", async ({ params }) =>
    withScenario(async () => {
      const nft = db.getNft(String(params.id))
      if (!nft) return Errors.notFound("NFT não encontrado.")
      return HttpResponse.json(nft)
    }),
  ),
]
