import { http, HttpResponse } from "msw"
import { db } from "../db"
import { isSessionExpiredScenario } from "../scenarios"
import { Errors, getSession, withScenario } from "./helpers"

function toSessionBody(user: ReturnType<typeof db.findUserById>, token: string, expiresAt: string) {
  if (!user) return null
  const { password: _password, ...publicUser } = user
  return { user: publicUser, token, expiresAt }
}

export const authHandlers = [
  http.post("/api/auth/register", async ({ request }) =>
    withScenario(async () => {
      const body = (await request.json()) as { name?: string; email?: string; password?: string }
      const fields: Record<string, string> = {}
      if (!body.name || body.name.trim().length < 2) fields.name = "Informe seu nome completo."
      if (!body.email || !/^\S+@\S+\.\S+$/.test(body.email)) fields.email = "Informe um e-mail válido."
      if (!body.password || body.password.length < 6) fields.password = "A senha deve ter ao menos 6 caracteres."
      if (Object.keys(fields).length > 0) return Errors.validation(fields)
      if (db.emailTaken(body.email!)) return Errors.emailTaken()

      const user = db.createUser({ name: body.name!.trim(), email: body.email!, password: body.password! })
      const session = db.createSession(user.id)
      return HttpResponse.json(toSessionBody(user, session.token, session.expiresAt), { status: 201 })
    }),
  ),

  http.post("/api/auth/login", async ({ request }) =>
    withScenario(async () => {
      const body = (await request.json()) as { email?: string; password?: string }
      const fields: Record<string, string> = {}
      if (!body.email) fields.email = "Informe seu e-mail."
      if (!body.password) fields.password = "Informe sua senha."
      if (Object.keys(fields).length > 0) return Errors.validation(fields)

      const user = db.findUserByEmail(body.email!)
      if (!user || user.password !== body.password) return Errors.invalidCredentials()

      const session = db.createSession(user.id)
      return HttpResponse.json(toSessionBody(user, session.token, session.expiresAt))
    }),
  ),

  http.get("/api/auth/session", async ({ request }) =>
    withScenario(
      async () => {
        if (isSessionExpiredScenario()) return Errors.unauthorized()
        const session = getSession(request)
        if (!session) return Errors.unauthorized()
        const user = db.findUserById(session.userId)
        if (!user) return Errors.unauthorized()
        return HttpResponse.json(toSessionBody(user, session.token, session.expiresAt))
      },
      { exempt: true },
    ),
  ),

  http.post("/api/auth/logout", async ({ request }) =>
    withScenario(
      async () => {
        const auth = request.headers.get("authorization")
        if (auth?.startsWith("Bearer ")) db.destroySession(auth.slice("Bearer ".length))
        return new HttpResponse(null, { status: 204 })
      },
      { exempt: true },
    ),
  ),
]
