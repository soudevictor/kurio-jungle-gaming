// One-off generator for local NFT artwork/avatar placeholders.
// Produces deterministic SVGs (no network dependency) so the mocked catalog
// has varied, stable imagery for screenshots, Lighthouse and Playwright
// visual baselines. See ARCHITECTURE.md > "Assets" for why these replace the
// original Figma bitmaps.
import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "..", "public", "assets")

// mulberry32 deterministic PRNG
function mulberry32(seed) {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashString(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  }
  return h
}

const PALETTES = [
  ["#FF7A1A", "#3A1206", "#1A0F08"],
  ["#FFB020", "#4A1E00", "#160C06"],
  ["#FF9A3D", "#2E1A3A", "#160B1A"],
  ["#FFD166", "#402312", "#1A1006"],
  ["#F2542D", "#341A12", "#170D08"],
  ["#FF6B6B", "#2B1220", "#150A10"],
  ["#7CFFCB", "#0F2E28", "#0A1714"],
  ["#5AD1E6", "#0F2430", "#0A1418"],
]

function svgArtwork(id, size = 640) {
  const rnd = mulberry32(hashString(id))
  const palette = PALETTES[Math.floor(rnd() * PALETTES.length)]
  const [accent, mid, bg] = palette
  const shapes = []
  const shapeCount = 4 + Math.floor(rnd() * 4)
  for (let i = 0; i < shapeCount; i++) {
    const cx = rnd() * size
    const cy = rnd() * size
    const r = size * (0.08 + rnd() * 0.22)
    const kind = rnd()
    const opacity = (0.12 + rnd() * 0.28).toFixed(2)
    const fill = rnd() > 0.5 ? accent : mid
    if (kind > 0.66) {
      const rot = Math.floor(rnd() * 360)
      shapes.push(
        `<rect x="${(cx - r).toFixed(1)}" y="${(cy - r).toFixed(1)}" width="${(r * 2).toFixed(1)}" height="${(r * 2).toFixed(1)}" fill="${fill}" opacity="${opacity}" transform="rotate(${rot} ${cx.toFixed(1)} ${cy.toFixed(1)})" />`,
      )
    } else if (kind > 0.33) {
      shapes.push(`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${fill}" opacity="${opacity}" />`)
    } else {
      const x2 = cx + (rnd() - 0.5) * size * 0.6
      const y2 = cy + (rnd() - 0.5) * size * 0.6
      shapes.push(
        `<line x1="${cx.toFixed(1)}" y1="${cy.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${fill}" stroke-width="${(2 + rnd() * 6).toFixed(1)}" opacity="${opacity}" stroke-linecap="round" />`,
      )
    }
  }
  const gradId = `g-${Math.abs(hashString(id))}`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-hidden="true">
  <defs>
    <radialGradient id="${gradId}" cx="30%" cy="20%" r="90%">
      <stop offset="0%" stop-color="${mid}" />
      <stop offset="100%" stop-color="${bg}" />
    </radialGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#${gradId})" />
  ${shapes.join("\n  ")}
  <rect width="${size}" height="${size}" fill="none" stroke="${accent}" stroke-opacity="0.15" stroke-width="2" />
</svg>`
}

function svgAvatar(id, size = 128) {
  const rnd = mulberry32(hashString(`avatar-${id}`))
  const palette = PALETTES[Math.floor(rnd() * PALETTES.length)]
  const [accent, mid, bg] = palette
  const gradId = `ga-${Math.abs(hashString(id))}`
  const cx = size / 2
  const cy = size / 2
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-hidden="true">
  <defs>
    <linearGradient id="${gradId}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${accent}" />
      <stop offset="100%" stop-color="${mid}" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size}" fill="${bg}" />
  <circle cx="${cx}" cy="${cy * 0.82}" r="${size * 0.22}" fill="url(#${gradId})" />
  <ellipse cx="${cx}" cy="${size * 1.05}" rx="${size * 0.38}" ry="${size * 0.32}" fill="url(#${gradId})" />
</svg>`
}

function heroIllustration(size = 800) {
  const rnd = mulberry32(42)
  const rings = []
  for (let i = 0; i < 5; i++) {
    rings.push(
      `<circle cx="${size * 0.62}" cy="${size * 0.4}" r="${size * (0.12 + i * 0.09)}" fill="none" stroke="#FF7A1A" stroke-opacity="${(0.28 - i * 0.045).toFixed(2)}" stroke-width="2" />`,
    )
  }
  const dots = []
  const dotRnd = mulberry32(7)
  for (let i = 0; i < 60; i++) {
    dots.push(
      `<circle cx="${(dotRnd() * size).toFixed(1)}" cy="${(dotRnd() * size).toFixed(1)}" r="${(0.6 + dotRnd() * 1.6).toFixed(1)}" fill="#FFD166" opacity="${(0.15 + dotRnd() * 0.35).toFixed(2)}" />`,
    )
  }
  void rnd
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-hidden="true">
  <defs>
    <radialGradient id="hero-bg" cx="65%" cy="35%" r="80%">
      <stop offset="0%" stop-color="#3A1206" />
      <stop offset="100%" stop-color="#120A06" />
    </radialGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#hero-bg)" />
  ${dots.join("\n  ")}
  ${rings.join("\n  ")}
  <rect x="${size * 0.18}" y="${size * 0.22}" width="${size * 0.5}" height="${size * 0.5}" rx="24" fill="#1A0F08" stroke="#FF7A1A" stroke-opacity="0.4" stroke-width="2" transform="rotate(-6 ${size * 0.43} ${size * 0.47})" />
  <rect x="${size * 0.3}" y="${size * 0.32}" width="${size * 0.44}" height="${size * 0.44}" rx="20" fill="#241408" stroke="#FFB020" stroke-opacity="0.6" stroke-width="2" transform="rotate(4 ${size * 0.52} ${size * 0.54})" />
</svg>`
}

const nftDir = join(root, "nft")
const avatarDir = join(root, "avatars")
mkdirSync(nftDir, { recursive: true })
mkdirSync(avatarDir, { recursive: true })

const NFT_IDS = Array.from({ length: 48 }, (_, i) => `nft-${String(i + 1).padStart(3, "0")}`)
const CREATOR_IDS = Array.from({ length: 10 }, (_, i) => `creator-${String(i + 1).padStart(2, "0")}`)
const USER_IDS = ["user-collector", "user-artlover"]

for (const id of NFT_IDS) {
  writeFileSync(join(nftDir, `${id}.svg`), svgArtwork(id))
}
for (const id of [...CREATOR_IDS, ...USER_IDS]) {
  writeFileSync(join(avatarDir, `${id}.svg`), svgAvatar(id))
}
writeFileSync(join(root, "hero.svg"), heroIllustration())

console.log(`Generated ${NFT_IDS.length} NFT artworks, ${CREATOR_IDS.length + USER_IDS.length} avatars, and 1 hero illustration.`)
