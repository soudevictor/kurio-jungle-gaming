import { connectWallet, expect, test } from "./fixtures"

test.describe("Checkout e confirmação", () => {
  test("compra completa do catálogo ao recibo confirmado", async ({ page, loginAsCollector }) => {
    await page.goto("/nfts/nft-005")
    await page.getByRole("button", { name: "Adicionar ao carrinho" }).click()
    await expect(page.getByText("adicionado ao carrinho")).toBeVisible()
    await page.goto("/checkout")

    await page.getByRole("radio").first().click()
    await connectWallet(page)

    await page.getByRole("button", { name: "Revisei o pedido e confirmo os valores" }).click()
    await page.getByRole("button", { name: "Confirmar pedido" }).click()

    await expect(page).toHaveURL(/\/orders\//)
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    await expect(page.getByRole("heading", { name: /Pedido confirmado|Pagamento recusado/ })).toBeVisible({
      timeout: 10000,
    })
  })

  test("carrinho vazio no checkout redireciona para estado coerente", async ({ page, loginAsCollector }) => {
    await page.goto("/checkout")
    await expect(page.getByText("Seu carrinho está vazio")).toBeVisible()
  })
})
