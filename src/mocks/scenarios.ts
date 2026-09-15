/**
 * Configurable network conditions for the MSW mock layer (README §6 —
 * "Simulating Network Conditions and Failures"). Persisted to localStorage so
 * a scenario picked in the UI (or set by a Playwright test via
 * `localStorage.setItem`) survives reloads and is reproducible.
 *
 * Handlers call `applyScenario(resource)` before resolving; it may delay,
 * throw a `ScenarioAbort` (network failure) or return an HTTP status/body
 * override that the handler should return verbatim.
 */

export type ScenarioName =
  | "default"
  | "slow"
  | "flaky"
  | "offline"
  | "server-error"
  | "empty-catalog"
  | "session-expired"

export const SCENARIO_NAMES: ScenarioName[] = [
  "default",
  "slow",
  "flaky",
  "offline",
  "server-error",
  "empty-catalog",
  "session-expired",
]

export const SCENARIO_LABEL: Record<ScenarioName, string> = {
  default: "Padrão (latência realista)",
  slow: "Latência alta (skeletons)",
  flaky: "Instável (falhas intermitentes)",
  offline: "Sem conexão",
  "server-error": "Erros 5xx",
  "empty-catalog": "Catálogo vazio",
  "session-expired": "Sessão expirada",
}

const STORAGE_KEY = "kurio.mock.scenario"

export function getScenario(): ScenarioName {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw && SCENARIO_NAMES.includes(raw as ScenarioName)) return raw as ScenarioName
  } catch {
    /* ignore */
  }
  return "default"
}

export function setScenario(name: ScenarioName) {
  try {
    localStorage.setItem(STORAGE_KEY, name)
  } catch {
    /* ignore */
  }
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min)
}

export class ScenarioNetworkError extends Error {
  constructor() {
    super("network_error")
    this.name = "ScenarioNetworkError"
  }
}

export class ScenarioServerError extends Error {
  status: number
  constructor(status = 500) {
    super("server_error")
    this.name = "ScenarioServerError"
    this.status = status
  }
}

interface ScenarioOptions {
  /** allow this resource to opt out of "offline"/"server-error" (e.g. session refresh) */
  exempt?: boolean
}

/** Delays and may throw according to the active scenario. Call at the top of every handler. */
export async function applyScenario(options: ScenarioOptions = {}): Promise<void> {
  const scenario = getScenario()

  switch (scenario) {
    case "slow":
      await wait(randomBetween(1800, 3200))
      return
    case "offline":
      if (!options.exempt) {
        await wait(randomBetween(200, 500))
        throw new ScenarioNetworkError()
      }
      await wait(randomBetween(120, 320))
      return
    case "server-error":
      if (!options.exempt) {
        await wait(randomBetween(200, 500))
        throw new ScenarioServerError(500)
      }
      await wait(randomBetween(120, 320))
      return
    case "flaky":
      await wait(randomBetween(300, 1600))
      if (!options.exempt && Math.random() < 0.35) {
        throw Math.random() < 0.5 ? new ScenarioNetworkError() : new ScenarioServerError(503)
      }
      return
    case "session-expired":
    case "empty-catalog":
    case "default":
    default:
      await wait(randomBetween(150, 450))
      return
  }
}

export function isEmptyCatalogScenario() {
  return getScenario() === "empty-catalog"
}

export function isSessionExpiredScenario() {
  return getScenario() === "session-expired"
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
