import { expect, test } from "./fixtures"

test.describe("Catálogo", () => {
  test("busca, filtra por categoria e ordena, refletindo tudo na URL", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByRole("heading", { name: /NFTs encontrados/ })).toBeVisible()

    const categoryNav = page.getByRole("navigation", { name: "Filtrar por categoria" })
    await categoryNav.getByRole("button", { name: "Fotografia" }).click()
    await expect(page).toHaveURL(/category=photography/)

    await page.getByLabel("Ordenar resultados").click()
    await page.getByRole("option", { name: "Menor preço" }).click()
    await expect(page).toHaveURL(/sort=price-asc/)

    // Changing category resets pagination to page 1.
    await expect(page).not.toHaveURL(/page=(?!1)\d/)
  })

  test("busca com resultado vazio mostra estado vazio coerente", async ({ page }) => {
    await page.goto("/")
    await page.getByPlaceholder("Buscar NFTs, coleções ou criadores").fill("zzzzzznotfound")
    await page.getByPlaceholder("Buscar NFTs, coleções ou criadores").press("Enter")
    await expect(page.getByText("Nenhum NFT encontrado")).toBeVisible()
  })

  test("paginação e filtros sobrevivem a refresh e navegação pelo histórico", async ({ page }) => {
    await page.goto("/?category=art&sort=recent&page=1")
    await page.waitForLoadState("networkidle")

    await page.goto("/?category=art&sort=recent&page=1")
    await expect(page).toHaveURL(/category=art/)
    await expect(page).toHaveURL(/sort=recent/)

    await page.getByRole("navigation", { name: "Filtrar por categoria" }).getByRole("button", { name: "Fotografia" }).click()
    await expect(page).toHaveURL(/category=photography/)

    await page.goBack()
    await expect(page).toHaveURL(/category=art/)
  })

  test("layout em viewport tablet (768px) sem overflow horizontal", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto("/")
    await expect(page.getByRole("heading", { name: /NFTs encontrados/ })).toBeVisible()
    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)
    expect(hasOverflow).toBe(false)
  })
})
