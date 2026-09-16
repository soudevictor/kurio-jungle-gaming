import { http, HttpResponse } from "msw"
import { db } from "../db"
import { Errors, getSession, withScenario } from "./helpers"

function publicUser(user: ReturnType<typeof db.findUserById>) {
  if (!user) return null
  const { password: _password, ...rest } = user
  return rest
}

export const profileHandlers = [
  http.get("/api/profile", async ({ request }) =>
    withScenario(async () => {
      const session = getSession(request)
      if (!session) return Errors.unauthorized()
      return HttpResponse.json(publicUser(db.findUserById(session.userId)))
    }),
  ),

  http.patch("/api/profile", async ({ request }) =>
    withScenario(async () => {
      const session = getSession(request)
      if (!session) return Errors.unauthorized()
      const body = (await request.json()) as { name?: string; bio?: string; avatarUrl?: string }
      const fields: Record<string, string> = {}
      if (body.name !== undefined && body.name.trim().length < 2) {
        fields.name = "Informe seu nome completo."
      }
      if (Object.keys(fields).length > 0) return Errors.validation(fields)

      const updated = db.updateUser(session.userId, {
        ...(body.name !== undefined ? { name: body.name.trim() } : {}),
        ...(body.bio !== undefined ? { bio: body.bio } : {}),
        ...(body.avatarUrl !== undefined ? { avatarUrl: body.avatarUrl } : {}),
      })
      return HttpResponse.json(publicUser(updated))
    }),
  ),

  http.post("/api/profile/password", async ({ request }) =>
    withScenario(async () => {
      const session = getSession(request)
      if (!session) return Errors.unauthorized()
      const body = (await request.json()) as { currentPassword?: string; newPassword?: string }
      const user = db.findUserById(session.userId)
      if (!user) return Errors.unauthorized()

      const fields: Record<string, string> = {}
      if (!body.currentPassword) fields.currentPassword = "Informe sua senha atual."
      else if (body.currentPassword !== user.password) fields.currentPassword = "Senha atual incorreta."
      if (!body.newPassword || body.newPassword.length < 6) {
        fields.newPassword = "A nova senha deve ter ao menos 6 caracteres."
      }
      if (Object.keys(fields).length > 0) return Errors.validation(fields)

      db.updateUser(session.userId, { password: body.newPassword! })
      return new HttpResponse(null, { status: 204 })
    }),
  ),
]
