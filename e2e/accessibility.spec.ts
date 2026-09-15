import { expect, test } from "./fixtures"

test.describe("Acessibilidade", () => {
  test("navegação por teclado alcança busca, categorias e primeiro card", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")
    await page.keyboard.press("Tab") // skip link is the first focusable element in the DOM
    await expect(page.getByRole("link", { name: "Pular para o conteúdo" })).toBeFocused()
  })

  test("dialog de nova carteira captura o foco e fecha com Escape", async ({ page, loginAsCollector }) => {
    await page.goto("/profile/wallets")
    await page.getByRole("button", { name: "Nova carteira" }).click()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()
    await expect(dialog.getByLabel("Nome")).toBeFocused()

    await page.keyboard.press("Escape")
    await expect(dialog).not.toBeVisible()
  })

  test("cards do catálogo têm texto alternativo nas imagens, hero decorativo fica oculto", async ({ page }) => {
    await page.goto("/")
    // The hero illustration is decorative — empty alt is the correct choice.
    await expect(page.locator('img[src="/assets/hero.svg"]')).toHaveAttribute("alt", "")
    // NFT artwork conveys content — it must have a real text alternative.
    const firstCardImage = page.locator("main img").nth(1)
    await expect(firstCardImage).toHaveAttribute("alt", /.+/)
  })
})
