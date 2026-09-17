import { zodResolver } from "@hookform/resolvers/zod"
import { createFileRoute } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export const Route = createFileRoute("/_authenticated/profile/wallets")({
  component: WalletsPage,
})

const schema = z.object({
  name: z.string().min(1, "Obrigatório"),
  alias: z.string().min(1, "Obrigatório"),
  network: z.string().min(1, "Obrigatório"),
  profileName: z.string().min(1, "Obrigatório"),
  address: z.string().min(1, "Obrigatório"),
  ensOrSecondary: z.string().optional(),
  walletType: z.string().min(1, "Obrigatório"),
  referralCode: z.string().min(1, "Obrigatório"),
  email: z.string().email("E-mail inválido").min(1, "Obrigatório"),
  ensName: z.string().min(1, "Obrigatório"),
})

export function WalletsPage() {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      alias: "",
      network: "",
      profileName: "",
      address: "",
      ensOrSecondary: "",
      walletType: "",
      referralCode: "",
      email: "",
      ensName: "",
    },
  })

  async function onSubmit(_values: z.infer<typeof schema>) {
    try {
      // Mocking submission for the expanded fields
      toast.success("Carteira salva")
    } catch (err) {
      toast.error("Não foi possível salvar a carteira.")
    }
  }

  return (
    <div className="w-full max-w-4xl mb-22 md:mb-0">
      {/* Primary Wallet Section */}
      <div className="flex flex-col md:flex-row md:justify-between items-start mb-8 gap-4">
        <div>
          <h2 className="font-heading text-xl md:text-2xl font-bold text-text-primary mb-1">
            Carteira principal
          </h2>
          <p className="text-sm text-text-secondary">
            Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.
          </p>
        </div>
        <button type="button" className="text-primary font-medium hover:underline shrink-0">
          Adicionar
        </button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
            
            {/* Left Column */}
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-text-secondary">
                      Nome de exibição <span className="text-primary">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input className="bg-black/40 border-border-soft h-10 md:h-12" {...field} />
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
                    <FormLabel className="text-text-secondary">
                      Rede <span className="text-primary">*</span>
                    </FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full bg-black/40 border-border-soft h-10 md:h-12">
                          <SelectValue placeholder="Selecione uma rede" />
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

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-text-secondary">
                      Endereço da carteira <span className="text-primary">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input className="font-mono bg-black/40 border-border-soft h-10 md:h-12" placeholder="Endereço 0x da carteira" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="walletType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-text-secondary">
                      Tipo de carteira <span className="text-primary">*</span>
                    </FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full bg-black/40 border-border-soft h-10 md:h-12">
                          <SelectValue placeholder="Selecione uma carteira" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="metamask">MetaMask</SelectItem>
                        <SelectItem value="walletconnect">WalletConnect</SelectItem>
                        <SelectItem value="coinbase">Coinbase Wallet</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-text-secondary">
                      E-mail <span className="text-primary">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="email" className="bg-black/40 border-border-soft h-10 md:h-12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="alias"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-text-secondary">
                      Apelido da carteira <span className="text-primary">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input className="bg-black/40 border-border-soft h-10 md:h-12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="profileName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-text-secondary">
                      Nome do perfil <span className="text-primary">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input className="bg-black/40 border-border-soft h-10 md:h-12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ensOrSecondary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-text-secondary">
                      ENS ou carteira secundária (opcional)
                    </FormLabel>
                    <FormControl>
                      <Input className="bg-black/40 border-border-soft h-10 md:h-12" placeholder="ENS ou carteira secundária (opcional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="referralCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-text-secondary">
                      Código de indicação <span className="text-primary">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input className="bg-black/40 border-border-soft h-10 md:h-12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ensName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-text-secondary">
                      Nome ENS <span className="text-primary">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="flex">
                        <select className="h-10 md:h-12 w-[80px] rounded-l-lg border border-r-0 border-border-soft bg-black/40 px-3 text-sm text-text-primary outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary">
                          <option value=".eth">.eth</option>
                        </select>
                        <Input className="flex-1 rounded-l-none bg-black/40 border-border-soft h-10 md:h-12 focus-visible:z-10" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

          </div>

          <div>
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 md:h-12 px-6 font-medium">
              Salvar carteira
            </Button>
          </div>
        </form>
      </Form>

      {/* Secondary Wallet Section */}
      <div className="mt-12 flex flex-col md:flex-row md:justify-between items-start md:items-center gap-6 border-t border-border-soft/60 pt-8 pb-10 md:pb-0">
        <div>
          <h3 className="font-heading text-lg font-bold text-text-primary mb-1">
            Carteira secundária
          </h3>
          <p className="text-sm text-text-secondary">
            Você ainda não adicionou uma carteira secundária.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
            <div className="size-4 rounded-full border border-primary flex items-center justify-center">
              {/* Fake empty radio button style */}
            </div>
            Igual à carteira principal
          </label>
          <button type="button" className="text-primary font-medium hover:underline">
            Adicionar
          </button>
        </div>
      </div>
    </div>
  )
}
