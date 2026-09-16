import { createFileRoute, Link } from "@tanstack/react-router"
import { CheckCircle2, Clock, ExternalLink, XCircle } from "lucide-react"
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

const NETWORK_LABEL: Record<string, string> = { ethereum: "Ethereum", polygon: "Polygon", base: "Base" }

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
    <div className="container-kurio max-w-xl py-16">
      <div className="rounded-xl border border-border/60 bg-card p-6 text-center" aria-live="polite">
        {order.status === "pending" && (
          <>
            <Clock className="mx-auto size-10 animate-pulse text-primary" aria-hidden />
            <h1 className="mt-4 font-heading text-2xl font-bold">Confirmando seu pedido…</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Estamos aguardando a confirmação da transação simulada. Isso leva alguns segundos.
            </p>
          </>
        )}
        {order.status === "confirmed" && (
          <>
            <CheckCircle2 className="mx-auto size-10 text-success" aria-hidden />
            <h1 className="mt-4 font-heading text-2xl font-bold">Pedido confirmado!</h1>
            <p className="mt-1 text-sm text-muted-foreground">Sua compra foi concluída com sucesso.</p>
          </>
        )}
        {order.status === "refused" && (
          <>
            <XCircle className="mx-auto size-10 text-destructive" aria-hidden />
            <h1 className="mt-4 font-heading text-2xl font-bold">Pagamento recusado</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Não foi possível confirmar a transação simulada. Nenhum valor foi cobrado.
            </p>
          </>
        )}

        <dl className="mt-6 grid grid-cols-2 gap-3 text-left text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Pedido</dt>
            <dd className="font-mono text-xs">{order.id}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Rede</dt>
            <dd>{NETWORK_LABEL[order.network] ?? order.network}</dd>
          </div>
          {order.txHash && (
            <div className="col-span-2">
              <dt className="text-xs text-muted-foreground">Transação (simulada)</dt>
              <dd className="flex items-center gap-1 font-mono text-xs">
                {order.txHash.slice(0, 10)}…{order.txHash.slice(-6)}
                <ExternalLink className="size-3" aria-hidden />
              </dd>
            </div>
          )}
        </dl>

        <ul className="mt-6 divide-y divide-border/60 text-left">
          {order.items.map((item) => (
            <li key={item.nftId} className="flex items-center gap-3 py-2">
              <img src={item.coverImage} alt="" className="size-10 rounded-md object-cover" />
              <span className="flex-1 text-sm">
                {item.quantity}× {item.title}
              </span>
              <span className="text-sm font-medium">{formatEth(item.unitPriceEth)}</span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-1.5 border-t border-border/60 pt-4 text-left text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd>{formatEth(order.subtotalEth)}</dd>
          </div>
          {order.couponCode && (
            <div className="flex justify-between text-success">
              <dt>Cupom {order.couponCode}</dt>
              <dd>−{formatEth(order.discountEth)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Taxa de rede</dt>
            <dd>{formatEth(order.networkFeeEth)}</dd>
          </div>
          <div className="flex justify-between font-heading text-base font-semibold">
            <dt>Total</dt>
            <dd>{formatEth(order.totalEth)}</dd>
          </div>
        </dl>

        <div className="mt-6 flex justify-center gap-2">
          {order.status === "refused" && (
            <Button asChild>
              <Link to="/cart">Voltar ao carrinho</Link>
            </Button>
          )}
          {order.status === "confirmed" && (
            <Button asChild>
              <Link to="/">Continuar explorando</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
