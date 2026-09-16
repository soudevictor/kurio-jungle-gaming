import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/features/auth/auth-context"
import { useCart } from "@/features/cart/use-cart"
import { useCreateOrder } from "@/features/orders/use-orders"
import { useWallets } from "@/features/wallets/use-wallets"
import { ApiError } from "@/lib/api/client"
import { formatEth, multiply } from "@/lib/money"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export const Route = createFileRoute("/_authenticated/checkout")({
  component: CheckoutPage,
})

function CheckoutPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { cart, quote, isLoading: isCartLoading, refetch } = useCart()
  const { data: wallets } = useWallets()
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null)
  const createOrder = useCreateOrder()

  const hasItems = (cart?.items.length ?? 0) > 0

  useEffect(() => {
    if (!selectedWalletId && wallets && wallets.length > 0) {
      setSelectedWalletId(wallets.find((w) => w.isPrimary)?.id ?? wallets[0].id)
    }
  }, [wallets, selectedWalletId])

  if (!isCartLoading && !hasItems) {
    return (
      <div className="container-kurio py-16 text-center">
        <p className="font-heading text-lg font-semibold">Seu carrinho está vazio</p>
        <Button className="mt-4 bg-primary text-ink hover:bg-primary/90" asChild>
          <Link to="/">Explorar catálogo</Link>
        </Button>
      </div>
    )
  }

  const selectedWallet = wallets?.find((w) => w.id === selectedWalletId)
  const hasBlockingIssues = (quote?.issues.length ?? 0) > 0
  const canSubmit = Boolean(selectedWallet) && !hasBlockingIssues && Boolean(quote)

  async function handleSubmit() {
    if (!selectedWallet || !quote) return
    try {
      const order = await createOrder.mutateAsync({
        walletId: selectedWallet.id,
        network: selectedWallet.network,
        expectedTotalEth: quote.totalEth,
      })
      navigate({ to: "/orders/$orderId", params: { orderId: order.id } })
    } catch (err) {
      if (err instanceof ApiError && err.code === "network_error") {
        toast.error("Não foi possível confirmar. Tentando recuperar o pedido…", { duration: 6000 })
        refetch()
      } else if (err instanceof ApiError) {
        toast.error(err.message)
        refetch()
      }
    }
  }

  return (
    <div className="container-kurio py-10">
      <div className="mb-8 flex items-center gap-2 text-sm font-medium text-text-secondary">
        <Link to="/" className="hover:text-text-primary">Início</Link>
        <span>/</span>
        <Link to="/" className="hover:text-text-primary">Mercado</Link>
        <span>/</span>
        <span className="text-text-primary">Pagamento</span>
      </div>

      <div className="mt-6 grid gap-12 lg:grid-cols-2 lg:gap-24">
        {/* Left Side: Forms */}
        <div className="space-y-8">
          <div>
            <h2 className="mb-6 font-heading text-lg font-bold text-text-primary">
              Perfil do colecionador
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-text-secondary">Nome de exibição <span className="text-primary">*</span></Label>
                <Input id="nome" defaultValue={user?.name} className="h-12 bg-transparent" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username" className="text-text-secondary">Nome de usuário <span className="text-primary">*</span></Label>
                <Input id="username" defaultValue={user?.name.toLowerCase().replace(/\s/g, "")} className="h-12 bg-transparent" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rede" className="text-text-secondary">Rede <span className="text-primary">*</span></Label>
                <Select defaultValue="ethereum">
                  <SelectTrigger id="rede" className="h-12 bg-transparent">
                    <SelectValue placeholder="Selecione uma rede" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ethereum">Ethereum</SelectItem>
                    <SelectItem value="polygon">Polygon</SelectItem>
                    <SelectItem value="base">Base</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="perfil" className="text-text-secondary">Nome do perfil <span className="text-primary">*</span></Label>
                <Input id="perfil" defaultValue={user?.name} className="h-12 bg-transparent" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endereco" className="text-text-secondary">Endereço da carteira <span className="text-primary">*</span></Label>
                <Input id="endereco" placeholder="Endereço 0x da carteira" defaultValue={selectedWallet?.address} className="h-12 bg-transparent" />
              </div>
              <div className="space-y-2 flex flex-col justify-end">
                <Input placeholder="ENS ou carteira secundária (opcional)" className="h-12 bg-transparent" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipoCarteira" className="text-text-secondary">Tipo de carteira <span className="text-primary">*</span></Label>
                <Select defaultValue="metamask">
                  <SelectTrigger id="tipoCarteira" className="h-12 bg-transparent">
                    <SelectValue placeholder="Selecione uma carteira" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="metamask">MetaMask</SelectItem>
                    <SelectItem value="walletconnect">WalletConnect</SelectItem>
                    <SelectItem value="coinbase">Coinbase Wallet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="indicacao" className="text-text-secondary">Código de indicação <span className="text-primary">*</span></Label>
                <Input id="indicacao" className="h-12 bg-transparent" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-text-secondary">E-mail <span className="text-primary">*</span></Label>
                <Input id="email" type="email" defaultValue={user?.email} className="h-12 bg-transparent" />
              </div>
              <div className="space-y-2 flex flex-col justify-end">
                <div className="flex gap-2 h-12">
                  <Input placeholder="Nome ENS" className="h-full bg-transparent flex-1 rounded-r-none border-r-0" />
                  <div className="flex items-center border border-border-soft/60 border-l-0 rounded-r-md px-3 bg-transparent text-text-secondary text-sm">
                    .eth <span className="ml-2 text-[10px]">▼</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2 text-sm text-text-secondary">
              <div className="size-4 rounded-full border border-primary"></div>
              <span>Usar outra carteira?</span>
            </div>

            <div className="mt-6 space-y-2">
              <Label htmlFor="obs" className="text-text-secondary">Observação do colecionador (opcional)</Label>
              <Textarea id="obs" className="min-h-[120px] bg-transparent resize-none" />
            </div>
          </div>
        </div>

        {/* Right Side: Order Summary */}
        <div>
          {cart && quote && (
            <div className="flex flex-col gap-6">
              <h2 className="font-heading text-lg font-bold text-text-primary">
                Seus NFTs
              </h2>
              
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-[3fr_1fr] border-b border-border-soft/40 pb-2 text-sm font-semibold text-text-primary">
                  <div>NFTs</div>
                  <div className="text-right">Subtotal</div>
                </div>
                
                {cart.items.map((item) => (
                  <div key={item.id} className="grid grid-cols-[3fr_1fr] items-center gap-4">
                    <div className="flex items-center gap-3">
                      <img src={item.nft.coverImage} alt="" className="size-12 rounded object-cover" />
                      <div className="flex flex-col">
                        <span className="font-heading text-sm font-bold text-text-primary">
                          {item.nft.title}
                        </span>
                        <span className="text-xs text-text-secondary">
                          ID do token: #{item.nftId.split("-")[1] || "000"}
                        </span>
                      </div>
                    </div>
                    <div className="text-right text-sm font-bold text-primary flex justify-end gap-3">
                      <span className="text-text-secondary font-normal text-xs mt-0.5">(x {item.quantity})</span>
                      {formatEth(multiply(item.nft.priceEth, item.quantity))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 text-center text-sm">
                <button type="button" className="text-text-secondary hover:text-primary transition-colors">
                  Tem um código promocional? Aplique aqui
                </button>
              </div>

              <div className="space-y-4 border-b border-border-soft/40 pb-4 pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Subtotal</span>
                  <span className="font-medium text-text-primary">{formatEth(quote.subtotalEth)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Desconto do lançamento</span>
                  <span className="font-medium text-text-primary">
                    {quote.couponValid && Number(quote.discountEth) > 0 ? `(-) ${formatEth(quote.discountEth).replace(' ETH', '')}` : "(-) 00.00"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <div className="flex flex-col">
                    <span className="text-text-secondary">Taxa de rede</span>
                    <span className="text-[10px] text-primary/70 text-right mt-1">Taxa estimada</span>
                  </div>
                  <span className="font-medium text-text-primary">{formatEth(quote.networkFeeEth)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between font-heading text-xl font-bold">
                <span className="text-text-primary">Total</span>
                <span className="text-primary">{formatEth(quote.totalEth)}</span>
              </div>

              <div className="mt-4 space-y-4">
                <h3 className="text-center font-heading text-base font-bold text-text-primary">Carteira e rede</h3>
                <div className="space-y-3">
                  <button type="button" className="flex w-full items-center gap-3 rounded border border-border-soft/40 bg-transparent p-4 text-left hover:border-primary/50 transition-colors">
                    <div className="size-4 rounded-full border border-border-soft"></div>
                    <div className="flex gap-2">
                      <span className="rounded bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">METAMASK</span>
                      <span className="rounded bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">WALLETCONNECT</span>
                      <span className="rounded bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">COINBASE</span>
                    </div>
                  </button>
                  <button type="button" className="flex w-full items-center gap-3 rounded border border-border-soft/40 bg-transparent p-4 text-left hover:border-primary/50 transition-colors">
                    <div className="size-4 rounded-full border border-border-soft"></div>
                    <span className="text-sm font-medium text-text-primary">MetaMask</span>
                  </button>
                  <button type="button" className="flex w-full items-center gap-3 rounded border border-primary bg-primary/10 p-4 text-left">
                    <div className="size-4 rounded-full border-4 border-primary bg-ink"></div>
                    <span className="text-sm font-medium text-text-primary">Coinbase Wallet</span>
                  </button>
                </div>
              </div>

              <Button 
                className="mt-6 h-12 w-full bg-primary font-bold text-ink hover:bg-primary/90" 
                disabled={!canSubmit || createOrder.isPending} 
                onClick={handleSubmit}
              >
                {createOrder.isPending ? "Processando…" : "Confirmar compra"}
              </Button>
              {hasBlockingIssues && (
                <p className="text-center text-xs text-error">
                  Resolva os problemas do carrinho antes de continuar.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
