import { createFileRoute, Link } from "@tanstack/react-router"
import { Clock, XCircle, Mail } from "lucide-react"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useOrder } from "@/features/orders/use-orders"
import { useCartId } from "@/features/cart/use-cart"
import { clearIdempotencyKey, clearPendingOrderId } from "@/features/orders/checkout-storage"
import { formatEth } from "@/lib/money"

export const Route = createFileRoute("/_authenticated/orders/$orderId")({
  component: OrderConfirmationPage,
})



function OrderConfirmationPage() {
  const { orderId } = Route.useParams()
  const { data: order, isLoading } = useOrder(orderId)
  const cartId = useCartId()

  useEffect(() => {
    if (order && order.status !== "pending") {
      clearIdempotencyKey(cartId)
      clearPendingOrderId()
    }
  }, [order, cartId])

  if (isLoading || !order) {
    return (
      <div className="container-kurio max-w-xl py-16">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="mt-4 h-40 w-full" />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto py-16">
      <div className="border-b-8 border-primary bg-surface-card p-8" aria-live="polite">
        {order.status === "pending" && (
          <div className="text-center">
            <Clock className="mx-auto size-10 animate-pulse text-primary" aria-hidden />
            <h1 className="mt-4 font-heading text-2xl font-bold">Confirmando seu pedido…</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Estamos aguardando a confirmação da transação simulada. Isso leva alguns segundos.
            </p>
          </div>
        )}
        {order.status === "refused" && (
          <div className="text-center">
            <XCircle className="mx-auto size-10 text-error" aria-hidden />
            <h1 className="mt-4 font-heading text-2xl font-bold">Pagamento recusado</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Não foi possível confirmar a transação simulada. Nenhum valor foi cobrado.
            </p>
            <div className="mt-6 flex justify-center gap-2">
              <Button asChild>
                <Link to="/cart">Voltar ao carrinho</Link>
              </Button>
            </div>
          </div>
        )}

        {order.status === "confirmed" && (
          <>
            <div className="flex flex-col items-center pb-6">
              <Mail className="size-10 text-primary" strokeWidth={1.5} aria-hidden />
              <h1 className="mt-4 text-sm text-text-secondary font-medium">Seus NFTs agora estão na sua carteira</h1>
            </div>

            <div className="grid grid-cols-4 divide-x divide-border-soft/60 border-y border-border-soft/60 py-4 text-left text-xs mb-6">
              <div className="flex flex-col gap-1 px-2 pl-0">
                <span className="text-text-primary font-bold">ID da transação</span>
                <span className="font-mono text-text-secondary truncate">
                  {order.txHash ? `${order.txHash.slice(0, 6)}...${order.txHash.slice(-4)}` : order.id.slice(0, 8)}
                </span>
              </div>
              <div className="flex flex-col gap-1 px-2">
                <span className="text-text-primary font-bold">Data</span>
                <span className="font-mono text-text-secondary">
                  {new Date(order.createdAt || Date.now()).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).replace(" de ", " ")}
                </span>
              </div>
              <div className="flex flex-col gap-1 px-2">
                <span className="text-text-primary font-bold">Total</span>
                <span className="font-mono text-text-secondary">{formatEth(order.totalEth)}</span>
              </div>
              <div className="flex flex-col gap-1 px-2 pr-0">
                <span className="text-text-primary font-bold">Carteira</span>
                <span className="font-mono text-text-secondary truncate">
                  MetaMask
                </span>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex justify-between border-b border-border-soft/60 pb-2 text-xs font-bold text-text-primary">
                <div className="w-[50%] text-left">NFTs</div>
                <div className="w-[20%] text-center">Edições</div>
                <div className="w-[30%] text-right">Subtotal</div>
              </div>
              <ul>
                {order.items.map((item) => (
                  <li key={item.nftId} className="flex items-center py-3">
                    <div className="flex w-[50%] items-center gap-3 text-left">
                      <img src={item.coverImage} alt="" className="size-10 rounded-md object-cover" />
                      <div className="flex flex-col overflow-hidden">
                        <span className="truncate text-sm font-bold text-text-primary">{item.title}</span>
                        <span className="text-xs text-text-secondary truncate">ID do token: #{item.nftId.split("-")[1] || "000"}</span>
                      </div>
                    </div>
                    <div className="w-[20%] text-center text-xs text-text-secondary font-mono">
                      (x {item.quantity})
                    </div>
                    <div className="w-[30%] text-right text-sm font-mono tabular-nums text-primary font-bold">
                      {formatEth((Number(item.unitPriceEth) * item.quantity).toString())}
                    </div>
                  </li>
                ))}
              </ul>

              <div className="flex flex-col space-y-2 pt-4 text-xs pr-0">
                <div className="flex justify-end gap-12">
                  <span className="text-text-secondary">Taxa de rede</span>
                  <span className="font-mono text-text-primary tabular-nums font-bold text-right min-w-[80px]">
                    {formatEth(order.networkFeeEth)}
                  </span>
                </div>
                <div className="flex justify-end gap-12 text-sm font-bold items-center mt-2">
                  <span className="text-text-primary">Total</span>
                  <span className="font-mono text-primary tabular-nums text-base text-right min-w-[80px]">
                    {formatEth(order.totalEth)}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-border-soft/60 pt-6 flex flex-col items-center gap-6">
              <p className="text-xs text-text-secondary text-center leading-relaxed">
                Transação confirmada na Ethereum. A propriedade foi transferida para sua carteira conectada e registrada na rede.
              </p>
              <Button asChild className="w-44 h-12 bg-primary text-ink font-bold hover:bg-primary/90 capitalize">
                <Link to="/">Ver no Etherscan</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
