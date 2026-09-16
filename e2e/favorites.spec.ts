import { expect, test } from "./fixtures"

test.describe("Favoritos", () => {
  test("alternar favorito é otimista e persiste após refresh", async ({ page, loginAsCollector }) => {
    await page.goto("/nfts/nft-006")
    const favButton = page.getByRole("button", { name: /favoritos/, pressed: false })
    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes("/api/favorites") && res.request().method() === "POST"),
      favButton.click(),
    ])
    expect(response.ok()).toBe(true)
    await expect(page.getByRole("button", { name: /favoritos/, pressed: true })).toBeVisible()

    await page.reload()
    await expect(page.getByRole("button", { name: /favoritos/, pressed: true })).toBeVisible()
  })

  test("favoritar sem sessão fica desabilitado", async ({ page }) => {
    await page.goto("/nfts/nft-007")
    await expect(page.getByRole("button", { name: /favoritos/ })).toBeDisabled()
  })
})
