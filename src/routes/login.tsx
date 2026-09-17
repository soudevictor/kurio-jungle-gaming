import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { z } from "zod"
import { useEffect } from "react"
import { useAuth } from "@/features/auth/auth-context"

const loginSearchSchema = z.object({
  redirect: z.string().optional(),
})

export const Route = createFileRoute("/login")({
  validateSearch: loginSearchSchema,
  component: LoginComponent,
})

function LoginComponent() {
  const { openAuthModal } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    openAuthModal("login")
    navigate({ to: "/", replace: true })
  }, [openAuthModal, navigate])

  return null
}
