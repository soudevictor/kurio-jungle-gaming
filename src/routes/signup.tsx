import { createFileRoute } from "@tanstack/react-router"

// This route exists so /signup is a valid URL. Rendering is handled by the
// AuthModal in __root.tsx which detects this pathname and opens the dialog.
export const Route = createFileRoute("/signup")({
  component: () => null,
})
