import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

const loginSearchSchema = z.object({
  redirect: z.string().optional(),
})

// This route exists so /login is a valid URL. Rendering is handled by the
// AuthModal in __root.tsx which detects this pathname and opens the dialog.
export const Route = createFileRoute("/login")({
  validateSearch: loginSearchSchema,
  component: () => null,
})
