import { http, HttpResponse } from "msw"
import { db } from "../db"
import { Errors, getSession, withScenario } from "./helpers"

export const favoriteHandlers = [
  http.get("/api/favorites", async ({ request }) =>
    withScenario(async () => {
      const session = getSession(request)
      if (!session) return Errors.unauthorized()
      const nfts = db
        .getFavorites(session.userId)
        .map((id) => db.getNft(id))
        .filter((n) => n !== undefined)
      return HttpResponse.json(nfts)
    }),
  ),

  http.post("/api/favorites", async ({ request }) =>
    withScenario(async () => {
      const session = getSession(request)
      if (!session) return Errors.unauthorized()
      const body = (await request.json()) as { nftId?: string }
      if (!body.nftId || !db.getNft(body.nftId)) return Errors.notFound("NFT não encontrado.")
      db.addFavorite(session.userId, body.nftId)
      return HttpResponse.json({ ok: true }, { status: 201 })
    }),
  ),

  http.delete("/api/favorites/:nftId", async ({ request, params }) =>
    withScenario(async () => {
      const session = getSession(request)
      if (!session) return Errors.unauthorized()
      db.removeFavorite(session.userId, String(params.nftId))
      return new HttpResponse(null, { status: 204 })
    }),
  ),
]
