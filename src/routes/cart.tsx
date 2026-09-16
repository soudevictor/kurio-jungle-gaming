import { createFileRoute, Link } from "@tanstack/react-router"
import { ShoppingBag, Trash2, Minus, Plus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/features/auth/auth-context"
import { useCart } from "@/features/cart/use-cart"
import { ApiError } from "@/lib/api/client"
import { formatEth, multiply } from "@/lib/money"
import { NftCard } from "@/components/nft/nft-card"
import { useNftList } from "@/features/nfts/use-nfts"

export const Route = createFileRoute("/cart")({
  component: CartPage,
})

function CartPage() {
  const { isAuthenticated } = useAuth()
  const { cart, isLoading, quote, isQuoteLoading, updateItem, removeItem, applyCoupon, removeCoupon } = useCart()
  const [couponInput, setCouponInput] = useState("")

  // Fetch some NFTs for the "Colecionadores também viram" section
  const { data: recommendedData } = useNftList({ sort: "trending", pageSize: 4 })

  const hasBlockingIssues = (quote?.issues.length ?? 0) > 0
  const hasItems = (cart?.items.length ?? 0) > 0

  function handleApplyCoupon(e: React.FormEvent) {
    e.preventDefault()
    if (!couponInput.trim()) return
    applyCoupon.mutate(couponInput.trim(), {
      onSuccess: () => {
        toast.success("Cupom aplicado")
        setCouponInput("")
      },
      onError: (err) => {
        toast.error(err instanceof ApiError ? err.message : "Cupom inválido.")
      },
    })
  }

  return (
    <div className="container-kurio py-10">
      <div className="mb-8 flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Início</Link>
        <span>/</span>
        <Link to="/" className="text-primary hover:text-primary/80">Mercado</Link>
        <span>/</span>
        <span className="text-foreground">Carrinho</span>
      </div>

      {isLoading && (
        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {!isLoading && !hasItems && (
        <div className="mt-10 flex flex-col items-center gap-3 rounded-xl border border-border/60 bg-surface py-20 text-center">
          <ShoppingBag className="size-10 text-muted-foreground" aria-hidden />
          <p className="font-heading text-lg font-semibold text-foreground">Seu carrinho está vazio</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Explore o catálogo e adicione NFTs para começar sua coleção.
          </p>
          <Button asChild className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90">
            <Link to="/">Explorar catálogo</Link>
          </Button>
        </div>
      )}

      {!isLoading && hasItems && cart && quote && (
        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* Items Table */}
          <div>
            <div className="mb-4 grid grid-cols-[3fr_1fr_1fr_1fr_auto] gap-4 border-b border-border/60 pb-2 text-sm font-semibold text-foreground">
              <div>NFTs</div>
              <div>Preço</div>
              <div>Edições</div>
              <div>Total</div>
              <div className="w-8"></div>
            </div>

            <div className="flex flex-col gap-3">
              {cart.items.map((item) => {
                const isSoldOut = item.nft.editionsAvailable <= 0
                const overAvailable = item.quantity > item.nft.editionsAvailable

                return (
                  <div key={item.id} className="grid grid-cols-[3fr_1fr_1fr_1fr_auto] items-center gap-4 rounded-xl border border-border/40 bg-[#1E1612] p-3">
                    {/* Column 1: NFT info */}
                    <div className="flex items-center gap-4">
                      <Link to="/nfts/$nftId" params={{ nftId: item.nftId }} className="shrink-0">
                        <img src={item.nft.coverImage} alt="" className="size-[72px] rounded object-cover" />
                      </Link>
                      <div className="flex flex-col">
                        <Link
                          to="/nfts/$nftId"
                          params={{ nftId: item.nftId }}
                          className="font-heading text-sm font-bold text-foreground hover:underline"
                        >
                          {item.nft.title}
                        </Link>
                        <p className="text-xs text-muted-foreground">ID do token: #{item.nftId.split("-")[1] || "000"}</p>
                        {isSoldOut && <span className="mt-1 text-[10px] font-medium text-destructive">Esgotado</span>}
                        {!isSoldOut && overAvailable && (
                          <span className="mt-1 text-[10px] font-medium text-destructive">Apenas {item.nft.editionsAvailable} disp.</span>
                        )}
                      </div>
                    </div>

                    {/* Column 2: Unit Price */}
                    <div className="text-sm font-semibold text-foreground">
                      {formatEth(item.nft.priceEth)}
                    </div>

                    {/* Column 3: Quantity Controls */}
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 items-center rounded-full bg-background/50 px-1">
                        <button
                          type="button"
                          className="flex size-6 items-center justify-center rounded-full bg-primary/20 text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
                          disabled={updateItem.isPending || item.quantity <= 1}
                          onClick={() => updateItem.mutate({ nftId: item.nftId, quantity: item.quantity - 1 })}
                          aria-label="Diminuir quantidade"
                        >
                          <Minus className="size-3" strokeWidth={3} />
                        </button>
                        <span className="w-8 text-center text-sm font-medium text-foreground">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          className="flex size-6 items-center justify-center rounded-full bg-primary/20 text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
                          disabled={updateItem.isPending || item.quantity >= item.nft.editionsAvailable}
                          onClick={() => updateItem.mutate({ nftId: item.nftId, quantity: item.quantity + 1 })}
                          aria-label="Aumentar quantidade"
                        >
                          <Plus className="size-3" strokeWidth={3} />
                        </button>
                      </div>
                    </div>

                    {/* Column 4: Total Price */}
                    <div className="text-sm font-bold text-primary">
                      {formatEth(multiply(item.nft.priceEth, item.quantity))}
                    </div>

                    {/* Column 5: Actions */}
                    <div className="flex justify-end pr-2">
                      <button
                        type="button"
                        className="text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
                        onClick={() => removeItem.mutate(item.nftId)}
                        disabled={removeItem.isPending}
                        aria-label="Remover item"
                      >
                        <Trash2 className="size-5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <div className="h-fit rounded-xl border border-border/40 bg-[#1E1612] p-6 shadow-sm">
              <h2 className="mb-6 font-heading text-lg font-bold text-foreground">
                Resumo da carteira
              </h2>

              <div className="mb-6">
                <label htmlFor="promo" className="mb-2 block text-sm font-medium text-foreground">
                  Código promocional
                </label>
                {cart.couponCode ? (
                  <div className="flex items-center justify-between rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
                    <span>Cupom: {cart.couponCode}</span>
                    <button
                      type="button"
                      className="text-xs font-semibold uppercase hover:underline"
                      onClick={() => removeCoupon.mutate()}
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex h-12">
                    <Input
                      id="promo"
                      placeholder="Digite o código promocional..."
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="h-full rounded-r-none border-r-0 bg-transparent"
                    />
                    <Button type="submit" className="h-full rounded-l-none bg-primary px-6 font-semibold text-primary-foreground hover:bg-primary/90" disabled={applyCoupon.isPending}>
                      Aplicar
                    </Button>
                  </form>
                )}
              </div>

              <div className="space-y-4 border-b border-border/60 pb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium text-foreground">{formatEth(quote.subtotalEth)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Desconto do lançamento</span>
                  <span className="font-medium text-foreground">
                    {quote.couponValid && Number(quote.discountEth) > 0 ? `(-) ${formatEth(quote.discountEth).replace(' ETH', '')}` : "(-) 00.00"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">Taxa de rede</span>
                    <span className="text-[10px] text-primary/70">Taxa estimada</span>
                  </div>
                  <span className="font-medium text-foreground">{formatEth(quote.networkFeeEth)}</span>
                </div>
              </div>

              <div className="my-4 flex items-center justify-between font-heading text-lg font-bold">
                <span className="text-foreground">Total</span>
                <span className="text-primary">{formatEth(quote.totalEth)}</span>
              </div>

              {quote.issues.length > 0 && (
                <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-xs text-destructive border border-destructive/20">
                  {quote.issues.map((issue, i) => (
                    <div key={i}>{issue.message}</div>
                  ))}
                </div>
              )}

              <Button className="h-12 w-full bg-primary font-bold text-primary-foreground hover:bg-primary/90" disabled={hasBlockingIssues || isQuoteLoading} asChild>
                <Link to={isAuthenticated ? "/checkout" : "/login"} search={isAuthenticated ? undefined : { redirect: "/checkout" }}>
                  Conectar e finalizar
                </Link>
              </Button>
              <div className="mt-4 text-center">
                <Link to="/" className="text-sm font-medium text-primary hover:underline">
                  Continuar explorando
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recommended section */}
      {!isLoading && (
        <div className="mt-20">
          <h2 className="mb-6 font-heading text-xl font-bold text-primary">Colecionadores também viram</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {recommendedData?.items.map((nft) => (
              <NftCard key={nft.id} nft={nft} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
