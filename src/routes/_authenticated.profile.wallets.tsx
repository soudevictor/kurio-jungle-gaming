import { zodResolver } from "@hookform/resolvers/zod"
import { createFileRoute } from "@tanstack/react-router"
import { Plus, Wallet as WalletIcon } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useCreateWallet, useUpdateWallet, useWallets } from "@/features/wallets/use-wallets"
import { ApiError } from "@/lib/api/client"
import type { Network, Wallet } from "@/types/domain"

export const Route = createFileRoute("/_authenticated/profile/wallets")({
  component: WalletsPage,
})

const NETWORK_LABEL: Record<Network, string> = { ethereum: "Ethereum", polygon: "Polygon", base: "Base" }

const schema = z.object({
  label: z.string().min(2, "Dê um nome para esta carteira."),
  address: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Endereço inválido (0x + 40 caracteres hexadecimais)."),
  network: z.enum(["ethereum", "polygon", "base"]),
  isPrimary: z.boolean(),
})

function WalletsPage() {
  const { data: wallets, isLoading } = useWallets()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Wallet | null>(null)

  return (
    <div className="container-kurio max-w-2xl space-y-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Carteiras</h1>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v)
            if (!v) setEditing(null)
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={() => setEditing(null)}>
              <Plus className="size-4" /> Nova carteira
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Editar carteira" : "Nova carteira"}</DialogTitle>
            </DialogHeader>
            <WalletForm wallet={editing} onDone={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      )}

      {!isLoading && wallets?.length === 0 && (
        <div className="rounded-xl border border-dashed border-border-soft/60 p-8 text-center text-sm text-text-secondary">
          Você ainda não tem carteiras cadastradas.
        </div>
      )}

      <div className="space-y-3">
        {wallets?.map((wallet) => (
          <div key={wallet.id} className="flex items-center justify-between rounded-xl border border-border-soft/60 bg-surface-card p-4">
            <div className="flex items-center gap-3">
              <WalletIcon className="size-5 text-text-secondary" />
              <div>
                <p className="font-medium">
                  {wallet.label} {wallet.isPrimary && <Badge className="ml-1 align-middle">Principal</Badge>}
                </p>
                <p className="font-mono text-xs text-text-secondary">
                  {wallet.address.slice(0, 8)}…{wallet.address.slice(-6)} · {NETWORK_LABEL[wallet.network]}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditing(wallet)
                setOpen(true)
              }}
            >
              Editar
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

function WalletForm({ wallet, onDone }: { wallet: Wallet | null; onDone: () => void }) {
  const createWallet = useCreateWallet()
  const updateWallet = useUpdateWallet()
  const isPending = createWallet.isPending || updateWallet.isPending

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: wallet
      ? { label: wallet.label, address: wallet.address, network: wallet.network, isPrimary: wallet.isPrimary }
      : { label: "", address: "", network: "ethereum", isPrimary: false },
  })

  async function onSubmit(values: z.infer<typeof schema>) {
    try {
      if (wallet) {
        await updateWallet.mutateAsync({ id: wallet.id, patch: values })
        toast.success("Carteira atualizada")
      } else {
        await createWallet.mutateAsync(values)
        toast.success("Carteira cadastrada")
      }
      onDone()
    } catch (err) {
      if (err instanceof ApiError && err.fields) {
        for (const [field, message] of Object.entries(err.fields)) {
          form.setError(field as keyof z.infer<typeof schema>, { message })
        }
      } else {
        toast.error(err instanceof ApiError ? err.message : "Não foi possível salvar a carteira.")
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField
          control={form.control}
          name="label"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Endereço</FormLabel>
              <FormControl>
                <Input className="font-mono" placeholder="0x…" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="network"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rede</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="ethereum">Ethereum</SelectItem>
                  <SelectItem value="polygon">Polygon</SelectItem>
                  <SelectItem value="base">Base</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.watch("isPrimary")}
            onChange={(e) => form.setValue("isPrimary", e.target.checked)}
            className="size-4 rounded border-border-soft"
          />
          Definir como carteira principal
        </label>
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Salvando…" : "Salvar carteira"}
        </Button>
      </form>
    </Form>
  )
}
