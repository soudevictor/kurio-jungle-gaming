import { expect, test } from "./fixtures"

test.describe("Detalhe do NFT", () => {
  test("acesso direto carrega o detalhe corretamente", async ({ page }) => {
    await page.goto("/nfts/nft-001")
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    await expect(page.getByText(/ETH$/).first()).toBeVisible()
  })

  test("NFT inexistente mostra página não encontrada", async ({ page }) => {
    await page.goto("/nfts/nft-does-not-exist")
    await expect(page.getByRole("heading", { name: "NFT não encontrado" })).toBeVisible()
    await page.getByRole("link", { name: "Voltar ao início" }).click()
    await expect(page).toHaveURL(/^http:\/\/[^/]+\/(\?.*)?$/)
  })

  test("limite de quantidade respeita edições disponíveis", async ({ page }) => {
    await page.goto("/nfts/nft-001")
    const increment = page.getByRole("button", { name: "Aumentar quantidade" })
    // Click far more times than any seed could have editions available.
    for (let i = 0; i < 30; i++) {
      if (await increment.isDisabled()) break
      await increment.click()
    }
    await expect(increment).toBeDisabled()
  })
})
