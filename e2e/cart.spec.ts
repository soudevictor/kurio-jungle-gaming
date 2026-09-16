import { expect, test } from "./fixtures"

test.describe("Carrinho", () => {
  test("adicionar, alterar quantidade e remover item", async ({ page }) => {
    await page.goto("/nfts/nft-002")
    await page.getByRole("button", { name: "Adicionar ao carrinho" }).click()
    await expect(page.getByText("adicionado ao carrinho")).toBeVisible()

    await page.goto("/cart")
    const increment = page.getByRole("button", { name: /Aumentar quantidade/ })
    await increment.click()
    await expect(page.locator("main").getByText("2", { exact: true })).toBeVisible()

    await page.getByRole("button", { name: /Remover/ }).click()
    await expect(page.getByText("Seu carrinho está vazio")).toBeVisible()
  })

  test("cupom inválido é rejeitado e cupom válido aplica desconto", async ({ page }) => {
    await page.goto("/nfts/nft-003")
    await page.getByRole("button", { name: "Adicionar ao carrinho" }).click()
    await expect(page.getByText("adicionado ao carrinho")).toBeVisible()
    await page.goto("/cart")

    await page.getByLabel("Código do cupom").fill("NAOEXISTE")
    await page.getByRole("button", { name: "Aplicar" }).click()
    await expect(page.getByText("Cupom inválido.")).toBeVisible()

    await page.getByLabel("Código do cupom").fill("KURIO10")
    await page.getByRole("button", { name: "Aplicar" }).click()
    await expect(page.getByText("Cupom KURIO10").first()).toBeVisible()
  })

  test("carrinho de visitante persiste após refresh e é mesclado ao autenticar", async ({ page }) => {
    await page.goto("/nfts/nft-004")
    await page.getByRole("button", { name: "Adicionar ao carrinho" }).click()
    await expect(page.getByText("adicionado ao carrinho")).toBeVisible()
    await page.reload()
    await page.goto("/cart")
    await expect(page.getByRole("heading", { name: "Carrinho" })).toBeVisible()
    await expect(page.getByText("Seu carrinho está vazio")).not.toBeVisible()

    await page.getByRole("link", { name: "Finalizar compra" }).click()
    await page.getByLabel("E-mail").fill("collector@kurio.app")
    await page.getByLabel("Senha", { exact: true }).fill("kurio123")
    await page.getByRole("button", { name: "Entrar" }).click()
    await expect(page.getByRole("button", { name: "Menu da conta" })).toBeVisible()

    await page.goto("/cart")
    await expect(page.getByText("Seu carrinho está vazio")).not.toBeVisible()
  })
})
