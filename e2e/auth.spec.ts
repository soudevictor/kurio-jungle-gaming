import { CREDENTIALS, expect, test } from "./fixtures"

test.describe("Conta e sessão", () => {
  test("cadastro cria conta e autentica", async ({ page }) => {
    const email = `novo.${Date.now()}@kurio.app`
    await page.goto("/signup")
    await page.getByLabel("Nome completo").fill("Nova Pessoa")
    await page.getByLabel("E-mail").fill(email)
    await page.getByLabel("Senha", { exact: true }).fill("segredo123")
    await page.getByLabel("Confirmar senha").fill("segredo123")
    await page.getByRole("button", { name: "Criar conta" }).click()
    await expect(page).toHaveURL(/^http:\/\/[^/]+\/(\?.*)?$/)
    await expect(page.getByRole("button", { name: "Menu da conta" })).toBeVisible()
  })

  test("cadastro com e-mail já usado retorna conflito", async ({ page }) => {
    await page.goto("/signup")
    await page.getByLabel("Nome completo").fill("Outra Pessoa")
    await page.getByLabel("E-mail").fill(CREDENTIALS.collector.email)
    await page.getByLabel("Senha", { exact: true }).fill("segredo123")
    await page.getByLabel("Confirmar senha").fill("segredo123")
    await page.getByRole("button", { name: "Criar conta" }).click()
    await expect(page.getByText("Este e-mail já está cadastrado.")).toBeVisible()
  })

  test("login com credenciais inválidas mostra erro", async ({ page }) => {
    await page.goto("/login")
    await page.getByLabel("E-mail").fill(CREDENTIALS.collector.email)
    await page.getByLabel("Senha", { exact: true }).fill("senha-errada")
    await page.getByRole("button", { name: "Entrar" }).click()
    await expect(page.getByText("E-mail ou senha inválidos.")).toBeVisible()
  })

  test("acesso direto a rota protegida redireciona ao login e retoma após entrar", async ({ page }) => {
    await page.goto("/profile")
    await expect(page).toHaveURL(/\/login\?redirect=/)
    await page.getByLabel("E-mail").fill(CREDENTIALS.collector.email)
    await page.getByLabel("Senha", { exact: true }).fill(CREDENTIALS.collector.password)
    await page.getByRole("button", { name: "Entrar" }).click()
    await expect(page).toHaveURL("/profile")
  })

  test("sessão sobrevive a refresh e logout limpa o estado", async ({ page, loginAsCollector }) => {
    await page.reload()
    await expect(page.getByText("Alex")).toBeVisible()

    await page.getByRole("button", { name: "Menu da conta" }).click()
    await page.getByRole("menuitem", { name: "Sair" }).click()
    await expect(page.getByRole("link", { name: "Entrar" })).toBeVisible()
  })
})
