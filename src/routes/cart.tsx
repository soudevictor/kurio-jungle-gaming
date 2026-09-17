import { NftCard } from "@/components/nft/nft-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/auth-context";
import { useCart } from "@/features/cart/use-cart";
import { useNftList } from "@/features/nfts/use-nfts";
import { ApiError } from "@/lib/api/client";
import { formatEth, multiply } from "@/lib/money";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/cart")({
  component: CartPage,
});

function CartPage() {
  const { isAuthenticated } = useAuth();
  const {
    cart,
    isLoading,
    quote,
    isQuoteLoading,
    updateItem,
    removeItem,
    applyCoupon,
    removeCoupon,
  } = useCart();
  const [couponInput, setCouponInput] = useState("");

  // Fetch some NFTs for the "Colecionadores também viram" section
  const { data: recommendedData } = useNftList({
    sort: "trending",
    pageSize: 4,
  });

  const hasBlockingIssues = (quote?.issues.length ?? 0) > 0;
  const hasItems = (cart?.items.length ?? 0) > 0;

  function handleApplyCoupon(e: React.FormEvent) {
    e.preventDefault();
    if (!couponInput.trim()) return;
    applyCoupon.mutate(couponInput.trim(), {
      onSuccess: () => {
        toast.success("Cupom aplicado");
        setCouponInput("");
      },
      onError: (err) => {
        toast.error(err instanceof ApiError ? err.message : "Cupom inválido.");
      },
    });
  }

  const navigate = useNavigate();

  return (
    <div className="container-kurio py-0 md:py-10 min-h-screen flex flex-col">
      {/* Mobile Header (Back + Title) */}
      <div className="flex items-center justify-center relative md:hidden py-6 border-b border-border-soft/40 mb-4">
        <button
          type="button"
          onClick={() => navigate({ to: "/" })}
          className="absolute left-0 flex size-10 items-center justify-center rounded-full bg-surface-raised border border-border text-secondary"
          aria-label="Voltar"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="font-heading text-lg font-bold text-text-primary">
          Carrinho de NFTs
        </h1>
      </div>

      <div className="hidden md:flex items-center gap-2 text-sm font-medium text-foreground">
        <Link to="/" className="hover:text-text-accent">
          Início
        </Link>
        <span>/</span>
        <Link to="/" className="hover:text-text-accent">
          Mercado
        </Link>
        <span>/</span>
        <span>Carrinho</span>
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
        <div className="mt-10 flex flex-col items-center gap-3 rounded-xl border border-border-soft/60 bg-surface-card py-20 text-center">
          <ShoppingBag className="size-10 text-text-secondary" aria-hidden />
          <p className="font-heading text-lg font-semibold text-text-primary">
            Seu carrinho está vazio
          </p>
          <p className="max-w-xs text-sm text-text-secondary">
            Explore o catálogo e adicione NFTs para começar sua coleção.
          </p>
          <Button
            asChild
            className="mt-4 bg-primary text-ink hover:bg-primary/90"
          >
            <Link to="/">Explorar catálogo</Link>
          </Button>
        </div>
      )}

      {/* Global style para empurrar o body inteiro (incluindo o Footer) e não ficar oculto pelo painel fixo no mobile */}
      <style>{`
        @media (max-width: 767px) {
          body {
            padding-bottom: 250px;
          }
        }
      `}</style>

      {!isLoading && hasItems && cart && quote && (
        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_380px] md:pb-0">
          {/* Items Table */}
          <div className="px-4 md:px-0">
            <div className="mb-4 hidden md:grid grid-cols-[3fr_1fr_1fr_1fr_auto] gap-4 border-b border-border-soft/60 pb-2 text-sm font-semibold text-text-primary">
              <div>NFTs</div>
              <div>Preço</div>
              <div>Edições</div>
              <div>Total</div>
              <div className="w-8"></div>
            </div>

            <div className="flex flex-col gap-3">
              {cart.items.map((item) => {
                const isSoldOut = item.nft.editionsAvailable <= 0;
                const overAvailable =
                  item.quantity > item.nft.editionsAvailable;

                return (
                  <div
                    key={item.id}
                    className="flex flex-col md:grid md:grid-cols-[3fr_1fr_1fr_1fr_auto] md:items-center gap-4 rounded-xl bg-surface-card p-4 md:p-0 md:pr-3 relative"
                  >
                    {/* Mobile: Row with Image + Info / Desktop: Column 1 */}
                    <div className="flex w-full items-center gap-4">
                      <Link
                        to="/nfts/$nftId"
                        params={{ nftId: item.nftId }}
                        className="shrink-0 self-start md:self-auto"
                      >
                        <img
                          src={item.nft.coverImage}
                          alt=""
                          className="size-[88px] md:size-[70px] rounded-lg md:rounded object-cover"
                        />
                      </Link>

                      <div className="flex flex-1 flex-col justify-center">
                        <Link
                          to="/nfts/$nftId"
                          params={{ nftId: item.nftId }}
                          className="font-heading text-base md:text-sm font-bold text-text-primary hover:underline"
                        >
                          {item.nft.title}
                        </Link>
                        <p className="text-xs text-text-secondary mt-0.5 md:mt-0">
                          <span className="md:hidden">
                            Edição: 1/{item.nft.editionsAvailable} (ID: #
                            {item.nftId.split("-")[1] || "000"})
                          </span>
                          <span className="hidden md:inline">
                            ID do token: #{item.nftId.split("-")[1] || "000"}
                          </span>
                        </p>
                        {isSoldOut && (
                          <span className="mt-1 text-[10px] font-medium text-error">
                            Esgotado
                          </span>
                        )}
                        {!isSoldOut && overAvailable && (
                          <span className="mt-1 text-[10px] font-medium text-error">
                            Apenas {item.nft.editionsAvailable} disp.
                          </span>
                        )}

                        {/* Mobile Row: Price and Controls */}
                        <div className="flex items-center justify-between mt-3 md:hidden">
                          {/* Mobile Unit Price */}
                          <div className="text-base font-bold text-primary font-mono tabular-nums">
                            {formatEth(item.nft.priceEth)}
                          </div>
                          {/* Mobile Quantity & Trash */}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="flex size-7 items-center justify-center rounded-full bg-primary text-ink transition-colors hover:bg-primary/90 disabled:opacity-40"
                              disabled={
                                updateItem.isPending || item.quantity <= 1
                              }
                              onClick={() =>
                                updateItem.mutate({
                                  nftId: item.nftId,
                                  quantity: item.quantity - 1,
                                })
                              }
                              aria-label="Diminuir quantidade"
                            >
                              <Minus className="size-4" strokeWidth={2.5} />
                            </button>
                            <span className="w-4 text-center font-mono text-sm font-bold text-text-primary tabular-nums">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              className="flex size-7 items-center justify-center rounded-full bg-primary text-ink transition-colors hover:bg-primary/90 disabled:opacity-40"
                              disabled={
                                updateItem.isPending ||
                                item.quantity >= item.nft.editionsAvailable
                              }
                              onClick={() =>
                                updateItem.mutate({
                                  nftId: item.nftId,
                                  quantity: item.quantity + 1,
                                })
                              }
                              aria-label="Aumentar quantidade"
                            >
                              <Plus className="size-4" strokeWidth={2.5} />
                            </button>

                            {/* Mobile Trash */}
                            <button
                              type="button"
                              className="ml-1 text-text-secondary transition-colors hover:text-error disabled:opacity-50"
                              onClick={() => removeItem.mutate(item.nftId)}
                              disabled={removeItem.isPending}
                              aria-label="Remover item"
                            >
                              <Trash2 className="size-[18px]" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Desktop Columns 2, 3, 4, 5 (Hidden on Mobile) */}

                    {/* Column 2: Unit Price */}
                    <div className="hidden md:block text-sm font-semibold text-text-secondary font-mono tabular-nums">
                      {formatEth(item.nft.priceEth)}
                    </div>

                    {/* Column 3: Quantity Controls */}
                    <div className="hidden md:flex items-center gap-3">
                      <button
                        type="button"
                        className="flex w-5 h-7 items-center justify-center rounded-full bg-primary text-ink transition-colors hover:bg-primary/90 disabled:opacity-40"
                        disabled={updateItem.isPending || item.quantity <= 1}
                        onClick={() =>
                          updateItem.mutate({
                            nftId: item.nftId,
                            quantity: item.quantity - 1,
                          })
                        }
                        aria-label="Diminuir quantidade"
                      >
                        <Minus className="size-4" strokeWidth={2.5} />
                      </button>
                      <span className="w-5 text-center font-mono text-sm font-bold tabular-nums text-text-primary">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        className="flex w-5 h-7 items-center justify-center rounded-full bg-primary text-ink transition-colors hover:bg-primary/90 disabled:opacity-40"
                        disabled={
                          updateItem.isPending ||
                          item.quantity >= item.nft.editionsAvailable
                        }
                        onClick={() =>
                          updateItem.mutate({
                            nftId: item.nftId,
                            quantity: item.quantity + 1,
                          })
                        }
                        aria-label="Aumentar quantidade"
                      >
                        <Plus className="size-4" strokeWidth={2.5} />
                      </button>
                    </div>

                    {/* Column 4: Total Price */}
                    <div className="hidden md:block text-sm font-bold text-primary font-mono tabular-nums">
                      {formatEth(multiply(item.nft.priceEth, item.quantity))}
                    </div>

                    {/* Column 5: Actions */}
                    <div className="hidden md:flex justify-end pr-2">
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
                );
              })}
            </div>
          </div>

          {/* Sidebar */}
          <div className="flex-1 lg:flex-none">
            <div className="fixed inset-x-0 bottom-0 z-40 bg-[#1E1612] p-6 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-border-soft/20 md:relative md:bg-transparent md:p-6 md:rounded-none md:shadow-sm md:border-none md:mt-0">
              <h2 className="mb-6 hidden md:block font-heading text-lg font-bold text-text-primary border-b border-border pb-2">
                Resumo da carteira
              </h2>

              <div className="mb-6">
                <label
                  htmlFor="promo"
                  className="mb-2 hidden md:block text-sm font-medium text-text-primary"
                >
                  Código promocional
                </label>
                {cart.couponCode ? (
                  <div className="flex items-center justify-between rounded-full md:rounded-md border border-success/30 bg-success/10 px-4 py-3 md:py-2 text-sm text-success">
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
                  <form onSubmit={handleApplyCoupon} className="flex h-12 md:h-12">
                    <Input
                      id="promo"
                      placeholder="Digite o código promocional..."
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="h-full rounded-l-full md:rounded-l-md rounded-r-none border-r-0 border-border-soft/40 md:border-primary bg-transparent text-text-primary pl-5"
                    />
                    <Button
                      type="submit"
                      className="h-full rounded-r-full md:rounded-r-md rounded-l-none bg-primary px-6 font-semibold text-ink hover:bg-primary/90"
                      disabled={applyCoupon.isPending}
                    >
                      Aplicar
                    </Button>
                  </form>
                )}
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-foreground">Subtotal</span>
                  <span className="font-mono tabular-nums font-normal text-foreground">
                    {formatEth(quote.subtotalEth)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground">
                    Desconto do lançamento
                  </span>
                  <span className="font-mono tabular-nums font-normal text-foreground">
                    {quote.couponValid && Number(quote.discountEth) > 0
                      ? `(-) ${formatEth(quote.discountEth).replace(" ETH", "")}`
                      : "(-) 00.00"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground">Taxa de rede</span>
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-mono tabular-nums font-normal text-foreground">
                      {formatEth(quote.networkFeeEth)}
                    </span>
                    <span className="text-end text-xs text-text-accent">
                      Taxa estimada
                    </span>
                  </div>
                </div>
              </div>

              <div className="my-4 flex items-center justify-between font-heading text-lg font-bold text-foreground">
                <span className="hidden md:inline">Total</span>
                <span className="md:hidden">Total</span>
                <span className="font-mono text-text-accent tabular-nums">
                  {formatEth(quote.totalEth)}
                </span>
              </div>

              {quote.issues.length > 0 && (
                <div className="mb-4 space-y-2 rounded-md bg-error/10 p-3 text-sm text-error">
                  {quote.issues.map((issue, idx) => (
                    <p key={idx}>• {issue.message}</p>
                  ))}
                </div>
              )}

              <Button
                className="h-14 md:h-12 w-full rounded-full md:rounded-md bg-primary font-bold capitalize text-ink hover:bg-primary/90"
                disabled={hasBlockingIssues || isQuoteLoading}
                asChild
              >
                <Link
                  to={isAuthenticated ? "/checkout" : "/login"}
                  search={
                    isAuthenticated ? undefined : { redirect: "/checkout" }
                  }
                >
                  Conectar e finalizar
                </Link>
              </Button>
              <div className="mt-4 hidden md:block text-center pb-20 md:pb-0">
                <Link
                  to="/"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Continuar explorando
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recommended section */}
      {!isLoading && (
        <div className="my-20">
          <h2 className="mb-6 font-heading text-xl font-bold text-primary border-b border-border">
            Colecionadores também viram
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {recommendedData?.items.map((nft) => (
              <NftCard key={nft.id} nft={nft} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
