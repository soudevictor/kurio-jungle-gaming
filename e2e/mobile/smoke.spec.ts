import { connectWallet, expect, test } from "../fixtures"

/**
 * Mobile-viewport coverage (README §8: "Avalie, no mínimo, larguras de 390,
 * 768 e 1440 pixels" / §9 item 6 "viewports desktop e mobile"). Runs under
 * the `chromium-mobile` project (Pixel 7 device profile, ~412px wide).
 */
test.describe("Mobile", () => {
  test("catálogo, filtro e abertura do menu funcionam sem overflow horizontal", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByRole("heading", { name: /NFTs encontrados/ })).toBeVisible()

    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)
    expect(hasOverflow).toBe(false)

    await page.getByRole("button", { name: "Abrir filtros" }).click()
    await expect(page.getByRole("navigation", { name: "Filtrar por categoria" })).toBeVisible()
  })

  test("compra completa funciona em viewport mobile", async ({ page, loginAsCollector }) => {
    await page.goto("/nfts/nft-003")
    await page.getByRole("button", { name: "Adicionar ao carrinho" }).click()
    await expect(page.getByText("adicionado ao carrinho")).toBeVisible()

    await page.goto("/checkout")
    await page.getByRole("radio").first().click()
    await connectWallet(page)
    await page.getByRole("button", { name: "Revisei o pedido e confirmo os valores" }).click()
    await page.getByRole("button", { name: "Confirmar pedido" }).click()

    await expect(page).toHaveURL(/\/orders\//)
    await expect(page.getByRole("heading", { name: /Pedido confirmado|Pagamento recusado/ })).toBeVisible({
      timeout: 10000,
    })
  })
})
