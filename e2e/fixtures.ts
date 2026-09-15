import { test as base, expect, type Page } from "@playwright/test"

export const CREDENTIALS = {
  collector: { email: "collector@kurio.app", password: "kurio123", name: "Alex Rivera" },
  artlover: { email: "artlover@kurio.app", password: "kurio123", name: "Sam Okafor" },
}

async function resetMocks(page: Page) {
  await page.goto("/")
  await page.evaluate(() => {
    localStorage.clear()
    ;(window as unknown as { __kurioMockReset?: () => void }).__kurioMockReset?.()
  })
}

async function login(page: Page, email: string, password: string) {
  await page.goto("/login")
  await page.getByLabel("E-mail").fill(email)
  await page.getByLabel("Senha", { exact: true }).fill(password)
  await page.getByRole("button", { name: "Entrar" }).click()
  // "Carrinho" is present in the header even while logged out — wait for
  // something that only renders once the session mutation has actually
  // resolved and navigated away from /login.
  await expect(page.getByRole("button", { name: "Menu da conta" })).toBeVisible()
  await expect(page).not.toHaveURL(/\/login/)
}

export const test = base.extend<{ resetMocks: void; loginAsCollector: void }>({
  resetMocks: [
    async ({ page }, use) => {
      await resetMocks(page)
      await use()
    },
    { auto: true },
  ],
  loginAsCollector: async ({ page }, use) => {
    await login(page, CREDENTIALS.collector.email, CREDENTIALS.collector.password)
    await use()
  },
})

/** The simulated wallet connection (README §"Pagamento e confirmação") fails
 * ~15% of the time on purpose. Retry "Tentar novamente" until it connects
 * instead of asserting on a single, non-deterministic attempt. */
export async function connectWallet(page: Page) {
  await page.getByRole("button", { name: "Conectar carteira" }).click()
  for (let attempt = 0; attempt < 8; attempt++) {
    const connected = page.getByText("Carteira conectada")
    const retry = page.getByRole("button", { name: "Tentar novamente" })
    await Promise.race([
      connected.waitFor({ timeout: 3000 }).catch(() => {}),
      retry.waitFor({ timeout: 3000 }).catch(() => {}),
    ])
    if (await connected.isVisible()) return
    if (await retry.isVisible()) {
      await retry.click()
      continue
    }
  }
  await expect(page.getByText("Carteira conectada")).toBeVisible({ timeout: 3000 })
}

export { expect, login }
