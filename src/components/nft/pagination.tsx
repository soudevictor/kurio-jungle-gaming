import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number
  totalPages: number
  onChange: (page: number) => void
}) {
  if (totalPages <= 1) return null

  const pages = pageWindow(page, totalPages)

  return (
    <nav aria-label="Paginação de resultados" className="flex items-center justify-center gap-1">
      <Button
        variant="outline"
        size="icon"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        aria-label="Página anterior"
      >
        <ChevronLeft className="size-4" />
      </Button>
      {pages.map((p, i) =>
        p === "…" ? (
          // eslint-disable-next-line react/no-array-index-key
          <span key={`ellipsis-${i}`} className="px-2 text-sm text-muted-foreground" aria-hidden>
            …
          </span>
        ) : (
          <Button
            key={p}
            variant={p === page ? "default" : "outline"}
            size="icon"
            aria-current={p === page ? "page" : undefined}
            onClick={() => onChange(p)}
          >
            {p}
          </Button>
        ),
      )}
      <Button
        variant="outline"
        size="icon"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        aria-label="Próxima página"
      >
        <ChevronRight className="size-4" />
      </Button>
    </nav>
  )
}

function pageWindow(page: number, totalPages: number): Array<number | "…"> {
  const delta = 1
  const range: Array<number | "…"> = []
  const start = Math.max(2, page - delta)
  const end = Math.min(totalPages - 1, page + delta)

  range.push(1)
  if (start > 2) range.push("…")
  for (let i = start; i <= end; i++) range.push(i)
  if (end < totalPages - 1) range.push("…")
  if (totalPages > 1) range.push(totalPages)

  return range
}
