import { http, HttpResponse } from "msw"
import type { Network, Wallet } from "@/types/domain"
import { db } from "../db"
import { Errors, getSession, withScenario } from "./helpers"

const NETWORKS: Network[] = ["ethereum", "polygon", "base"]
const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/

export const walletHandlers = [
  http.get("/api/wallets", async ({ request }) =>
    withScenario(async () => {
      const session = getSession(request)
      if (!session) return Errors.unauthorized()
      return HttpResponse.json(db.getWallets(session.userId))
    }),
  ),

  http.post("/api/wallets", async ({ request }) =>
    withScenario(async () => {
      const session = getSession(request)
      if (!session) return Errors.unauthorized()
      const body = (await request.json()) as Partial<Wallet>

      const fields: Record<string, string> = {}
      if (!body.label || body.label.trim().length < 2) fields.label = "Dê um nome para esta carteira."
      if (!body.address || !ADDRESS_RE.test(body.address)) {
        fields.address = "Informe um endereço válido (0x + 40 caracteres hexadecimais)."
      }
      if (!body.network || !NETWORKS.includes(body.network)) fields.network = "Selecione uma rede."
      if (Object.keys(fields).length > 0) return Errors.validation(fields)

      const existing = db.getWallets(session.userId)
      if (existing.some((w) => w.address.toLowerCase() === body.address!.toLowerCase())) {
        return Errors.conflict("Esta carteira já está cadastrada.")
      }

      const wallet: Wallet = {
        id: `wallet-${crypto.randomUUID()}`,
        label: body.label!.trim(),
        address: body.address!,
        network: body.network!,
        isPrimary: existing.length === 0 ? true : Boolean(body.isPrimary),
        createdAt: new Date().toISOString(),
      }
      db.upsertWallet(session.userId, wallet)
      return HttpResponse.json(wallet, { status: 201 })
    }),
  ),

  http.patch("/api/wallets/:id", async ({ request, params }) =>
    withScenario(async () => {
      const session = getSession(request)
      if (!session) return Errors.unauthorized()
      const body = (await request.json()) as Partial<Wallet>
      const list = db.getWallets(session.userId)
      const existing = list.find((w) => w.id === params.id)
      if (!existing) return Errors.notFound("Carteira não encontrada.")

      if (body.address && !ADDRESS_RE.test(body.address)) {
        return Errors.validation({ address: "Informe um endereço válido (0x + 40 caracteres hexadecimais)." })
      }
      if (body.network && !NETWORKS.includes(body.network)) {
        return Errors.validation({ network: "Selecione uma rede." })
      }

      const updated: Wallet = {
        ...existing,
        ...(body.label !== undefined ? { label: body.label.trim() } : {}),
        ...(body.address !== undefined ? { address: body.address } : {}),
        ...(body.network !== undefined ? { network: body.network } : {}),
        ...(body.isPrimary !== undefined ? { isPrimary: body.isPrimary } : {}),
      }
      db.upsertWallet(session.userId, updated)
      return HttpResponse.json(updated)
    }),
  ),
]
