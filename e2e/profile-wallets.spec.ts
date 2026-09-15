import { expect, test } from "./fixtures"

test.describe("Perfil e carteiras", () => {
  test("edição de perfil valida nome vazio e salva alterações", async ({ page, loginAsCollector }) => {
    await page.goto("/profile")
    const nameInput = page.getByLabel("Nome")
    await nameInput.fill("A")
    await page.getByRole("button", { name: "Salvar alterações" }).click()
    await expect(page.getByText("Informe seu nome completo.")).toBeVisible()

    await nameInput.fill("Alex Rivera Atualizado")
    await page.getByRole("button", { name: "Salvar alterações" }).click()
    await expect(page.getByText("Perfil atualizado")).toBeVisible()
    await page.reload()
    await expect(nameInput).toHaveValue("Alex Rivera Atualizado")
  })

  test("alterar senha com senha atual incorreta mostra erro", async ({ page, loginAsCollector }) => {
    await page.goto("/profile")
    await page.getByLabel("Senha atual").fill("errada")
    await page.getByLabel("Nova senha", { exact: true }).fill("novaSenha123")
    await page.getByLabel("Confirmar nova senha").fill("novaSenha123")
    await page.getByRole("button", { name: "Alterar senha" }).click()
    await expect(page.getByText("Senha atual incorreta.")).toBeVisible()
  })

  test("cadastro de carteira valida endereço e evita duplicidade", async ({ page, loginAsCollector }) => {
    await page.goto("/profile/wallets")
    await page.getByRole("button", { name: "Nova carteira" }).click()
    await page.getByLabel("Nome").fill("Carteira de testes")
    await page.getByLabel("Endereço").fill("endereco-invalido")
    await page.getByRole("button", { name: "Salvar carteira" }).click()
    await expect(page.getByText(/Endereço inválido/)).toBeVisible()

    await page.getByLabel("Endereço").fill("0x8f3a1C9b2E4d5F6a7B8c9D0e1F2a3B4c5D6e7F80")
    await page.getByRole("button", { name: "Salvar carteira" }).click()
    await expect(page.getByText("Esta carteira já está cadastrada.")).toBeVisible()
  })
})
