import { expect, test } from "./fixtures"

/**
 * Visual regression baselines (README §9). First run creates the baseline
 * PNGs under e2e/visual.spec.ts-snapshots/ — commit them. Re-run with
 * `--update-snapshots` after an intentional visual change.
 */
test.describe("Regressão visual", () => {
  test("início", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByRole("heading", { name: /NFTs encontrados/ })).toBeVisible()
    await expect(page).toHaveScreenshot("home.png", { fullPage: true, maxDiffPixelRatio: 0.02 })
  })

  test("detalhe do NFT", async ({ page }) => {
    await page.goto("/nfts/nft-010")
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    await expect(page).toHaveScreenshot("nft-detail.png", { fullPage: true, maxDiffPixelRatio: 0.02 })
  })

  test("carrinho", async ({ page }) => {
    await page.goto("/nfts/nft-011")
    await page.getByRole("button", { name: "Adicionar ao carrinho" }).click()
    await page.goto("/cart")
    await expect(page.getByRole("heading", { name: "Carrinho" })).toBeVisible()
    await expect(page).toHaveScreenshot("cart.png", { fullPage: true, maxDiffPixelRatio: 0.02 })
  })

  test("pagamento", async ({ page, loginAsCollector }) => {
    await page.goto("/nfts/nft-012")
    await page.getByRole("button", { name: "Adicionar ao carrinho" }).click()
    await expect(page.getByText("adicionado ao carrinho")).toBeVisible()
    await page.goto("/checkout")
    await expect(page.getByRole("heading", { name: "Pagamento" })).toBeVisible()
    await expect(page).toHaveScreenshot("checkout.png", { fullPage: true, maxDiffPixelRatio: 0.02 })
  })
})
