import { connectWallet, expect, test } from "./fixtures"

test.describe("Tempo real", () => {
  test("mudança de preço via socket durante o checkout exige nova confirmação", async ({ page, loginAsCollector }) => {
    await page.goto("/nfts/nft-001")
    await page.getByRole("button", { name: "Adicionar ao carrinho" }).click()
    await expect(page.getByText("adicionado ao carrinho")).toBeVisible()
    await page.goto("/checkout")

    await page.getByRole("radio").first().click()
    await connectWallet(page)
    await page.getByRole("button", { name: "Revisei o pedido e confirmo os valores" }).click()

    // Simulate the server pushing a price change for the item mid-checkout.
    await page.evaluate(() => {
      ;(window as unknown as { __kurioForceNftUpdate: (id: string, patch: object) => void }).__kurioForceNftUpdate(
        "nft-001",
        { priceEth: "9.999" },
      )
    })

    await expect(page.getByText("Um item do seu carrinho foi atualizado")).toBeVisible()
    // Confirmation must be required again — the button should no longer be
    // enabled from the previous review.
    await expect(page.getByRole("button", { name: "Revisei o pedido e confirmo os valores" })).toBeVisible()
  })

  test("evento duplicado/antigo não reaplica efeitos", async ({ page }) => {
    await page.goto("/nfts/nft-002")
    await page.waitForLoadState("networkidle")
    await page.evaluate(() => {
      const w = window as unknown as { __kurioForceNftUpdate: (id: string, patch: object) => void }
      w.__kurioForceNftUpdate("nft-002", { priceEth: "1.234" })
    })
    await expect(page.getByText("1.234 ETH")).toBeVisible()

    // Re-emitting the exact same version bump path should not double-toast
    // or otherwise reapply — the price stays exactly where it is.
    await page.evaluate(() => {
      const w = window as unknown as { __kurioForceNftUpdate: (id: string, patch: object) => void }
      w.__kurioForceNftUpdate("nft-002", { priceEth: "1.234" })
    })
    await expect(page.getByText("1.234 ETH")).toBeVisible()
  })
})
