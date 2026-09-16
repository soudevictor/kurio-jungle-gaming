// Lighthouse audit runner (README §10). Audits Início ("/") and Detalhe do
// NFT ("/nfts/:id") on mobile and desktop profiles, against the production
// build served by `vite preview`, using the default mock scenario.
//
// Usage:
//   npm run build && npm run lighthouse
//
// Reports (HTML + JSON, 3 runs each) land in lighthouse-reports/, plus a
// summary.json with the median of each category per page/profile and the
// tool/environment versions used for the run.
import { execSync, spawn } from "node:child_process"
import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import lighthouse from "lighthouse"
import * as chromeLauncher from "chrome-launcher"

// chrome-launcher only looks at well-known system install paths by default;
// in this environment only Playwright's bundled Chromium is guaranteed to
// exist, so point it there explicitly unless the caller already set one.
if (!process.env.CHROME_PATH) {
  const candidates = [
    join(process.env.LOCALAPPDATA ?? "", "ms-playwright"),
    join(process.env.HOME ?? "", "AppData", "Local", "ms-playwright"),
  ]
  for (const base of candidates) {
    try {
      const { readdirSync } = await import("node:fs")
      const dirs = readdirSync(base).filter((d) => d.startsWith("chromium-"))
      if (dirs.length > 0) {
        const exe = join(base, dirs.sort().at(-1), "chrome-win64", "chrome.exe")
        process.env.CHROME_PATH = exe
        break
      }
    } catch {
      /* try next candidate */
    }
  }
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "..")
const outDir = join(root, "lighthouse-reports")
mkdirSync(outDir, { recursive: true })

const PORT = 4174
const BASE_URL = `http://localhost:${PORT}`
const RUNS_PER_PAGE = 3

const PAGES = [
  { name: "inicio", path: "/" },
  { name: "detalhe-nft", path: "/nfts/nft-001" },
]

const PROFILES = {
  mobile: {
    formFactor: "mobile",
    screenEmulation: { mobile: true, width: 412, height: 823, deviceScaleFactor: 2.625, disabled: false },
    throttling: {
      rttMs: 150,
      throughputKbps: 1638.4,
      cpuSlowdownMultiplier: 4,
      requestLatencyMs: 150 * 3.75,
      downloadThroughputKbps: 1638.4 * 0.9,
      uploadThroughputKbps: 675 * 0.9,
    },
  },
  desktop: {
    formFactor: "desktop",
    screenEmulation: { mobile: false, width: 1440, height: 900, deviceScaleFactor: 1, disabled: false },
    throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1 },
  },
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

async function waitForServer(url, timeoutMs = 30_000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url)
      if (res.ok || res.status < 500) return
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(`Server at ${url} did not become ready in time`)
}

function toolVersions() {
  const node = process.version
  let vite = "unknown"
  try {
    vite = JSON.parse(execSync("npm ls vite --json", { cwd: root }).toString()).dependencies.vite.version
  } catch {
    /* best-effort */
  }
  return { node, vite, lighthouse: lighthouse.version ?? "13.x", platform: `${process.platform} ${process.arch}` }
}

// chrome-launcher's cleanup (`destroyTmp`) deletes its temp profile dir
// synchronously and Windows sometimes still has it open for a beat, throwing
// EPERM well outside any promise this script awaits. It's harmless (the
// audit result is already captured) — don't let it crash the whole run.
process.on("uncaughtException", (err) => {
  if (err && typeof err === "object" && "code" in err && err.code === "EPERM") return
  console.error(err)
  process.exitCode = 1
})

async function main() {
  console.log("Starting production preview server…")
  const preview = spawn("npx", ["vite", "preview", "--port", String(PORT), "--strictPort"], {
    cwd: root,
    stdio: "inherit",
    shell: true,
  })

  const cleanup = () => preview.kill()
  process.on("exit", cleanup)

  try {
    await waitForServer(BASE_URL)

    const summary = { generatedAt: new Date().toISOString(), environment: toolVersions(), results: [] }

    for (const page of PAGES) {
      for (const [profileName, profileConfig] of Object.entries(PROFILES)) {
        console.log(`Auditing ${page.name} (${profileName})…`)
        const runs = []

        for (let i = 0; i < RUNS_PER_PAGE; i++) {
          const chrome = await chromeLauncher.launch({ chromeFlags: ["--headless=new", "--no-sandbox"] })
          try {
            const result = await lighthouse(
              `${BASE_URL}${page.path}`,
              { port: chrome.port, output: ["html", "json"], logLevel: "error" },
              { extends: "lighthouse:default", settings: profileConfig },
            )
            const categories = result.lhr.categories
            const scores = {
              performance: categories.performance.score * 100,
              accessibility: categories.accessibility.score * 100,
              "best-practices": categories["best-practices"].score * 100,
              seo: categories.seo.score * 100,
            }
            const metrics = {
              lcp: result.lhr.audits["largest-contentful-paint"].numericValue,
              cls: result.lhr.audits["cumulative-layout-shift"].numericValue,
              tbt: result.lhr.audits["total-blocking-time"].numericValue,
            }
            runs.push({ scores, metrics })

            const base = join(outDir, `${page.name}-${profileName}-run${i + 1}`)
            writeFileSync(`${base}.html`, result.report[0])
            writeFileSync(`${base}.json`, result.report[1])
          } finally {
            // Windows sometimes still holds the profile dir open for a beat;
            // failing to delete it isn't worth aborting the whole audit run.
            // `chrome.kill()` can throw *synchronously* (not just reject), so a
            // real try/catch is needed — a `.catch()` chained onto the call
            // never attaches in that case.
            try {
              await chrome.kill()
            } catch {
              /* ignore cleanup failure */
            }
          }
        }

        summary.results.push({
          page: page.name,
          path: page.path,
          profile: profileName,
          runs: runs.length,
          median: {
            performance: median(runs.map((r) => r.scores.performance)),
            accessibility: median(runs.map((r) => r.scores.accessibility)),
            "best-practices": median(runs.map((r) => r.scores["best-practices"])),
            seo: median(runs.map((r) => r.scores.seo)),
            lcpMs: median(runs.map((r) => r.metrics.lcp)),
            cls: median(runs.map((r) => r.metrics.cls)),
            tbtMs: median(runs.map((r) => r.metrics.tbt)),
          },
        })
      }
    }

    writeFileSync(join(outDir, "summary.json"), JSON.stringify(summary, null, 2))
    console.log("\n=== Lighthouse summary (median of 3 runs) ===")
    for (const r of summary.results) {
      console.log(
        `${r.page} [${r.profile}] — perf ${r.median.performance.toFixed(0)}, a11y ${r.median.accessibility.toFixed(0)}, ` +
          `best-practices ${r.median["best-practices"].toFixed(0)}, seo ${r.median.seo.toFixed(0)}, ` +
          `LCP ${(r.median.lcpMs / 1000).toFixed(2)}s, CLS ${r.median.cls.toFixed(3)}, TBT ${r.median.tbtMs.toFixed(0)}ms`,
      )
    }
    console.log(`\nFull reports in ${outDir}`)
  } finally {
    cleanup()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
