import type { NftCategory } from "@/types/domain"

/** Presentation metadata for the NFT domain, independent of mock fixtures. */
export const NFT_CATEGORY_LABELS: Record<NftCategory, string> = {
  art: "Arte",
  photography: "Fotografia",
  music: "Música",
  "3d": "3D",
  collectibles: "Colecionáveis",
  generative: "Generativa",
  gaming: "Gaming",
  subscriptions: "Assinaturas",
  utility: "Utilidade",
  sports: "Esportes",
}

export function getNftCategoryLabel(category: NftCategory | "all") {
  return category === "all" ? "Todos os NFTs" : NFT_CATEGORY_LABELS[category]
}
