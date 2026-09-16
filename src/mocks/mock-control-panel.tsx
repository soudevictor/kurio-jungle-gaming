import { useQueryClient } from "@tanstack/react-query"
import { RotateCcw, Settings2, X } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SCENARIO_LABEL, SCENARIO_NAMES, getScenario, setScenario, type ScenarioName } from "@/mocks/scenarios"

/**
 * Floating control for the mocked network layer (README §6: scenarios must
 * be "configuráveis e reproduzíveis"). Ships in the demo build too — it's
 * gated by the same `VITE_ENABLE_MOCKS` flag as the mocks themselves, not by
 * `import.meta.env.DEV` — so an evaluator can switch scenarios without
 * touching devtools.
 */
export function MockControlPanel() {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState<ScenarioName>(getScenario())
  const queryClient = useQueryClient()

  function handleChange(value: ScenarioName) {
    setScenario(value)
    setCurrent(value)
    queryClient.invalidateQueries()
    toast(`Cenário de mock: ${SCENARIO_LABEL[value]}`)
  }

  function handleReset() {
    ;(window as unknown as { __kurioMockReset?: () => void }).__kurioMockReset?.()
    queryClient.clear()
    toast.success("Dados simulados restaurados")
  }

  if (!open) {
    return (
      <Button
        variant="secondary"
        size="icon"
        className="fixed bottom-4 right-4 z-50 rounded-full shadow-lg"
        aria-label="Abrir painel de cenários de mock"
        onClick={() => setOpen(true)}
      >
        <Settings2 className="size-4" />
      </Button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-72 rounded-xl border border-border-soft/60 bg-surface-card p-4 text-text-primary shadow-xl">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Cenários de mock</h2>
        <Button variant="ghost" size="icon-sm" aria-label="Fechar painel" onClick={() => setOpen(false)}>
          <X className="size-4" />
        </Button>
      </div>
      <Select value={current} onValueChange={(v) => handleChange(v as ScenarioName)}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SCENARIO_NAMES.map((name) => (
            <SelectItem key={name} value={name}>
              {SCENARIO_LABEL[name]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="mt-2 text-xs text-text-secondary">
        Afeta latência e falhas simuladas nas próximas requisições. Recarregue a página para reaplicar a telas já
        carregadas.
      </p>
      <Button variant="outline" size="sm" className="mt-3 w-full" onClick={handleReset}>
        <RotateCcw className="size-3.5" /> Resetar dados simulados
      </Button>
    </div>
  )
}
