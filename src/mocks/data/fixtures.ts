import type { Creator, Nft, NftCategory, User, Wallet } from "@/types/domain"
import { hashString, mulberry32 } from "./rng"

// ---------------------------------------------------------------------------
// Users (fictitious credentials — see README "Credenciais" section)
// ---------------------------------------------------------------------------

export const FIXTURE_PASSWORD = "kurio123"

export interface FixtureUser extends User {
  password: string
}

export const USERS: FixtureUser[] = [
  {
    id: "user-collector",
    name: "Alex Rivera",
    email: "collector@kurio.app",
    password: FIXTURE_PASSWORD,
    avatarUrl: "/assets/avatars/user-collector.svg",
    bio: "Colecionador de arte generativa e fotografia digital.",
    createdAt: "2024-02-11T10:00:00.000Z",
  },
  {
    id: "user-artlover",
    name: "Sam Okafor",
    email: "artlover@kurio.app",
    password: FIXTURE_PASSWORD,
    avatarUrl: "/assets/avatars/user-artlover.svg",
    bio: "Sempre em busca da próxima drop em alta.",
    createdAt: "2024-05-03T14:30:00.000Z",
  },
]

// ---------------------------------------------------------------------------
// Creators
// ---------------------------------------------------------------------------

const CREATOR_NAMES: Array<[string, string]> = [
  ["Nova Batista", "@novab"],
  ["Kai Lindqvist", "@kailind"],
  ["Priya Menon", "@priyam"],
  ["Théo Duarte", "@theodrt"],
  ["Yuki Tanaka", "@yukit"],
  ["Zara Idris", "@zaraid"],
  ["Marco Conti", "@marcoc"],
  ["Ines Kowalski", "@ineskw"],
  ["Diego Salas", "@diegosal"],
  ["Amara Chukwu", "@amarach"],
]

export const CREATORS: Creator[] = CREATOR_NAMES.map(([name, handle], i) => {
  const id = `creator-${String(i + 1).padStart(2, "0")}`
  return {
    id,
    name,
    handle,
    avatarUrl: `/assets/avatars/${id}.svg`,
    verified: i % 3 !== 2,
  }
})

// ---------------------------------------------------------------------------
// NFTs
// ---------------------------------------------------------------------------

const CATEGORIES: NftCategory[] = [
  "art",
  "photography",
  "music",
  "3d",
  "collectibles",
  "generative",
  "gaming",
  "subscriptions",
  "utility",
  "sports"
]

const CATEGORY_LABEL: Record<NftCategory, string> = {
  art: "Arte digital",
  photography: "Fotografia",
  music: "Música",
  "3d": "Arte 3D",
  collectibles: "Colecionáveis",
  generative: "Generativa",
  gaming: "Jogos",
  subscriptions: "Assinaturas",
  utility: "Utilidade",
  sports: "Esportes",
}

export { CATEGORY_LABEL }

const ADJECTIVES = [
  "Genesis",
  "Ethereal",
  "Neon",
  "Fractal",
  "Obsidian",
  "Solar",
  "Nebula",
  "Cipher",
  "Velvet",
  "Quantum",
  "Crimson",
  "Astral",
]

const NOUNS = [
  "Dream",
  "Horizon",
  "Fragment",
  "Echo",
  "Bloom",
  "Drift",
  "Mirage",
  "Pulse",
  "Relic",
  "Shard",
  "Voyage",
  "Signal",
]

const COLLECTIONS = [
  "Kurio Originals",
  "Neon Foundry",
  "Analog Futures",
  "Static Bloom",
  "Aurora Circuit",
  "Drift Archive",
]

function buildNft(index: number): Nft {
  const id = `nft-${String(index + 1).padStart(3, "0")}`
  const rnd = mulberry32(hashString(id))
  const category = CATEGORIES[index % CATEGORIES.length]
  const adjective = ADJECTIVES[Math.floor(rnd() * ADJECTIVES.length)]
  const noun = NOUNS[Math.floor(rnd() * NOUNS.length)]
  const title = `${adjective} ${noun} #${String(index + 1).padStart(3, "0")}`
  const creator = CREATORS[index % CREATORS.length]
  const editionsTotal = 1 + Math.floor(rnd() * 20)
  const soldRatio = rnd()
  const editionsAvailable = Math.max(0, Math.round(editionsTotal * (1 - soldRatio * 0.8)))
  const basePrice = 0.02 + rnd() * 4.5
  const priceEth = basePrice.toFixed(rnd() > 0.5 ? 2 : 3)
  const hasLastSale = rnd() > 0.4
  const daysAgo = Math.floor(rnd() * 220)
  const createdAt = new Date(Date.now() - daysAgo * 86_400_000).toISOString()

  return {
    id,
    slug: `${adjective}-${noun}-${index + 1}`.toLowerCase(),
    title,
    description:
      "Peça gerada em colaboração entre arte generativa e curadoria manual, cunhada em edição limitada. Cada unidade carrega metadados únicos de composição, paleta e semente de geração.",
    category,
    tags: [CATEGORY_LABEL[category], collectionTag(rnd), rnd() > 0.5 ? "Edição limitada" : "1 de 1"],
    creator,
    collection: COLLECTIONS[index % COLLECTIONS.length],
    // Only nft-001..nft-004 have real artwork SVGs (~2.5 MB each).
    // nft-005..nft-048 are 1-KB placeholder stubs; cycle through the four
    // real images so the catalog always shows actual monkey artwork.
    images: [0, 1, 2, 3].map(() => `/assets/nft/nft-${String((index % 4) + 1).padStart(3, "0")}.svg`),
    coverImage: `/assets/nft/nft-${String((index % 4) + 1).padStart(3, "0")}.svg`,
    priceEth,
    lastSalePriceEth: hasLastSale ? (basePrice * (0.85 + rnd() * 0.3)).toFixed(3) : null,
    editionsTotal,
    editionsAvailable,
    likes: Math.floor(rnd() * 480),
    trending: rnd() > 0.82,
    isNew: daysAgo < 7,
    attributes: [
      { trait: "Paleta", value: rnd() > 0.5 ? "Quente" : "Fria" },
      { trait: "Complexidade", value: ["Baixa", "Média", "Alta"][Math.floor(rnd() * 3)] },
      { trait: "Formato", value: "Quadrado" },
    ],
    createdAt,
    version: 1,
  }
}

function collectionTag(rnd: () => number) {
  const tags = ["Alta demanda", "Curadoria Kurio", "Recém-lançado", "Artista verificado"]
  return tags[Math.floor(rnd() * tags.length)]
}

export const NFTS: Nft[] = Array.from({ length: 48 }, (_, i) => buildNft(i))

// Give the very first NFT a scripted, reliable price/availability drift so
// the realtime scenario described in the README ("um NFT no carrinho tem seu
// preço alterado durante a navegação") is easy to demo and to assert on in
// Playwright without depending on the random background drift.
export const SCRIPTED_DRIFT_NFT_ID = NFTS[0].id

// ---------------------------------------------------------------------------
// Wallets
// ---------------------------------------------------------------------------

export const WALLETS: Wallet[] = [
  {
    id: "wallet-collector-1",
    label: "Carteira principal",
    address: "0x8f3a1C9b2E4d5F6a7B8c9D0e1F2a3B4c5D6e7F80",
    network: "ethereum",
    isPrimary: true,
    createdAt: "2024-02-12T09:00:00.000Z",
  },
  {
    id: "wallet-collector-2",
    label: "Carteira de reserva",
    address: "0x1a2B3c4D5e6F7a8B9c0D1e2F3a4B5c6D7e8F9a0B",
    network: "polygon",
    isPrimary: false,
    createdAt: "2024-06-01T09:00:00.000Z",
  },
  {
    id: "wallet-artlover-1",
    label: "Carteira principal",
    address: "0x4B5c6D7e8F9a0B1c2D3e4F5a6B7c8D9e0F1a2B3c",
    network: "base",
    isPrimary: true,
    createdAt: "2024-05-04T09:00:00.000Z",
  },
]

export const WALLETS_BY_USER: Record<string, string[]> = {
  "user-collector": ["wallet-collector-1", "wallet-collector-2"],
  "user-artlover": ["wallet-artlover-1"],
}

// ---------------------------------------------------------------------------
// Coupons
// ---------------------------------------------------------------------------

export interface Coupon {
  code: string
  kind: "percentage" | "fixed"
  value: number // percentage (0-100) or fixed ETH amount
  expiresAt: string | null
  maxUses: number | null
}

export const COUPONS: Coupon[] = [
  { code: "KURIO10", kind: "percentage", value: 10, expiresAt: null, maxUses: null },
  { code: "WELCOME005", kind: "fixed", value: 0.005, expiresAt: null, maxUses: null },
  {
    code: "EXPIRED20",
    kind: "percentage",
    value: 20,
    expiresAt: "2024-01-01T00:00:00.000Z",
    maxUses: null,
  },
]

export const NETWORK_FEE_ETH = "0.0021"
