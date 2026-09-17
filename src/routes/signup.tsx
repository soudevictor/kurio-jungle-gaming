import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect } from "react"
import { useAuth } from "@/features/auth/auth-context"

export const Route = createFileRoute("/signup")({
  component: SignupComponent,
})

function SignupComponent() {
  const { openAuthModal } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    openAuthModal("signup")
    navigate({ to: "/", replace: true })
  }, [openAuthModal, navigate])

  return null
}
