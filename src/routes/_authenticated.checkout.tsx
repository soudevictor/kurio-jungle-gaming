import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/features/auth/auth-context";
import { useCart } from "@/features/cart/use-cart";
import { useCreateOrder } from "@/features/orders/use-orders";
import { useWallets } from "@/features/wallets/use-wallets";
import { ApiError } from "@/lib/api/client";
import { formatEth, multiply } from "@/lib/money";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/checkout")({
  component: CheckoutPage,
});

function CheckoutPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { cart, quote, isLoading: isCartLoading, refetch } = useCart();
  const { data: wallets } = useWallets();
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [useAnotherWallet, setUseAnotherWallet] = useState(false);
  const createOrder = useCreateOrder();

  const hasItems = (cart?.items.length ?? 0) > 0;

  useEffect(() => {
    if (!selectedWalletId && wallets && wallets.length > 0) {
      setSelectedWalletId(
        wallets.find((w) => w.isPrimary)?.id ?? wallets[0].id,
      );
    }
  }, [wallets, selectedWalletId]);

  if (!isCartLoading && !hasItems) {
    return (
      <div className="container-kurio py-16 text-center">
        <p className="font-heading text-lg font-semibold">
          Seu carrinho está vazio
        </p>
        <Button
          className="mt-4 bg-primary text-ink hover:bg-primary/90"
          asChild
        >
          <Link to="/">Explorar catálogo</Link>
        </Button>
      </div>
    );
  }

  const selectedWallet = wallets?.find((w) => w.id === selectedWalletId);
  const hasBlockingIssues = (quote?.issues.length ?? 0) > 0;
  const canSubmit =
    Boolean(selectedWallet) && !hasBlockingIssues && Boolean(quote);

  async function handleSubmit() {
    if (!selectedWallet || !quote) return;
    try {
      const order = await createOrder.mutateAsync({
        walletId: selectedWallet.id,
        network: selectedWallet.network,
        expectedTotalEth: quote.totalEth,
      });
      navigate({ to: "/orders/$orderId", params: { orderId: order.id } });
    } catch (err) {
      if (err instanceof ApiError && err.code === "network_error") {
        toast.error(
          "Não foi possível confirmar. Tentando recuperar o pedido…",
          { duration: 6000 },
        );
        refetch();
      } else if (err instanceof ApiError) {
        toast.error(err.message);
        refetch();
      }
    }
  }

  return (
    <div className="container-kurio py-4 md:py-10">
      {/* Mobile Header */}
      <div className="flex md:hidden items-center justify-center relative p-4 mb-4">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="absolute left-4 flex size-10 items-center justify-center rounded-full bg-surface-dark hover:bg-surface-card transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-primary"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h1 className="font-heading text-lg font-bold text-text-primary">
          Pagamento com carteira
        </h1>
      </div>

      <div className="hidden md:flex mb-8 items-center gap-2 text-sm font-medium text-text-secondary">
        <Link to="/" className="hover:text-text-primary">
          Início
        </Link>
        <span>/</span>
        <Link to="/" className="hover:text-text-primary">
          Mercado
        </Link>
        <span>/</span>
        <span className="text-text-primary">Pagamento</span>
      </div>

      <div className="mt-0 md:mt-6 grid gap-12 lg:grid-cols-2 lg:gap-24">
        {/* Left Side: Forms */}
        <div className="hidden md:block space-y-8">
          <div>
            <h2 className="mb-6 font-heading text-lg font-bold text-text-primary">
              Perfil do colecionador
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-text-secondary">
                  Nome de exibição <span className="text-primary">*</span>
                </Label>
                <Input
                  id="nome"
                  defaultValue={user?.name}
                  className="h-12 bg-black/40 border border-border-soft/40"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username" className="text-text-secondary">
                  Nome de usuário <span className="text-primary">*</span>
                </Label>
                <Input
                  id="username"
                  defaultValue={user?.name.toLowerCase().replace(/\s/g, "")}
                  className="h-12 bg-black/40 border border-border-soft/40"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rede" className="text-text-secondary">
                  Rede <span className="text-primary">*</span>
                </Label>
                <Select defaultValue="ethereum">
                  <SelectTrigger
                    id="rede"
                    className="w-full h-12 bg-black/40 border border-border-soft/40"
                  >
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
                <Label htmlFor="perfil" className="text-text-secondary">
                  Nome do perfil <span className="text-primary">*</span>
                </Label>
                <Input
                  id="perfil"
                  defaultValue={user?.name}
                  className="h-12 bg-black/40 border border-border-soft/40"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endereco" className="text-text-secondary">
                  Endereço da carteira <span className="text-primary">*</span>
                </Label>
                <Input
                  id="endereco"
                  placeholder="Endereço 0x da carteira"
                  defaultValue={selectedWallet?.address}
                  className="h-12 bg-black/40 border border-border-soft/40"
                />
              </div>
              <div className="space-y-2 flex flex-col justify-end">
                <Input
                  placeholder="ENS ou carteira secundária (opcional)"
                  className="h-12 bg-black/40 border border-border-soft/40"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipoCarteira" className="text-text-secondary">
                  Tipo de carteira <span className="text-primary">*</span>
                </Label>
                <Select defaultValue="metamask">
                  <SelectTrigger
                    id="tipoCarteira"
                    className="w-full h-12 bg-black/40 border border-border-soft/40"
                  >
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
                <Label htmlFor="indicacao" className="text-text-secondary">
                  Código de indicação <span className="text-primary">*</span>
                </Label>
                <Input
                  id="indicacao"
                  className="h-12 bg-black/40 border border-border-soft/40"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-text-secondary">
                  E-mail <span className="text-primary">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue={user?.email}
                  className="h-12 bg-black/40 border border-border-soft/40"
                />
              </div>
              <div className="space-y-2 flex flex-col justify-end">
                <div className="flex h-12">
                  <Input
                    placeholder="Nome ENS"
                    className="h-full bg-black/40 flex-1 rounded-r-none border-r-0 border border-border-soft/40"
                  />
                  <div className="flex items-center border border-border-soft/40 border-l-0 rounded-r-md px-3 bg-black/40 text-text-secondary text-sm">
                    .eth <span className="ml-2 text-[10px]">▼</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setUseAnotherWallet(!useAnotherWallet)}
              className="mt-6 flex items-center gap-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
            >
              <div className="flex size-4 items-center justify-center rounded-full border border-primary">
                {useAnotherWallet && (
                  <div className="size-2 rounded-full bg-primary" />
                )}
              </div>
              <span>Usar outra carteira?</span>
            </button>

            <div className="mt-6 space-y-2">
              <Label htmlFor="obs" className="text-text-secondary">
                Observação do colecionador (opcional)
              </Label>
              <Textarea
                id="obs"
                className="min-h-[120px] max-w-2/3 bg-black/40 border border-border-soft/40 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Right Side: Order Summary */}
        <div>
          {cart && quote && (
            <div className="flex flex-col gap-6">
              <h2 className="hidden md:block font-heading text-lg font-bold text-text-primary">
                Seus NFTs
              </h2>

              <div className="hidden md:flex flex-col gap-4">
                <div className="grid grid-cols-[3fr_1fr] border-b border-border-soft/40 pb-2 text-sm font-semibold text-text-primary">
                  <div>NFTs</div>
                  <div className="text-right">Subtotal</div>
                </div>

                {cart.items.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[3fr_1fr] items-center pr-4 gap-4 bg-surface-card"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={item.nft.coverImage}
                        alt=""
                        className="size-16 rounded object-cover"
                      />
                      <div className="flex flex-col">
                        <span className="font-heading text-sm font-bold text-text-primary">
                          {item.nft.title}
                        </span>
                        <span className="text-xs text-text-secondary">
                          ID do token: #{item.nftId.split("-")[1] || "000"}
                        </span>
                      </div>
                    </div>
                    <div className="text-right text-sm font-bold text-primary flex justify-end gap-3 tabular-nums font-mono">
                      <span className="text-text-secondary font-normal text-xs font-sans mt-0.5">
                        (x {item.quantity})
                      </span>
                      {formatEth(multiply(item.nft.priceEth, item.quantity))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden md:block text-center text-sm">
                <Link
                  to="/cart"
                  className="text-text-secondary hover:text-primary transition-colors"
                >
                  Tem um código promocional? Aplique aqui
                </Link>
              </div>

              <div className="hidden md:flex flex-col space-y-4 border-b border-border-soft/40 pb-4 pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Subtotal</span>
                  <span className="font-medium text-text-primary tabular-nums font-mono">
                    {formatEth(quote.subtotalEth)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">
                    Desconto do lançamento
                  </span>
                  <span className="font-medium text-text-primary tabular-nums font-mono">
                    {quote.couponValid && Number(quote.discountEth) > 0
                      ? `(-) ${formatEth(quote.discountEth).replace(" ETH", "")}`
                      : "(-) 00.00"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <div className="flex flex-col">
                    <span className="text-text-secondary">Taxa de rede</span>
                  </div>
                  <span className="font-medium text-text-primary tabular-nums font-mono">
                    {formatEth(quote.networkFeeEth)}
                  </span>
                </div>
                <span className="text-xs text-text-accent text-center mt-1">
                  Taxa estimada
                </span>
              </div>

              {/* Desktop Total */}
              <div className="hidden md:flex items-center justify-between font-heading text-xl font-bold mb-6">
                <span className="text-text-primary">Total:</span>
                <span className="text-primary tabular-nums font-mono text-xl">
                  {formatEth(quote.totalEth)}
                </span>
              </div>

              <RadioGroup
                value={selectedWalletId || ""}
                onValueChange={setSelectedWalletId}
                className="flex flex-col gap-8 md:gap-4 md:mb-0"
              >
                {/* Desktop "Carteira e rede" Title */}
                <h3 className="hidden md:block text-center font-heading text-base font-bold text-text-primary">
                  Carteira e rede
                </h3>

                {/* --- MOBILE SECTIONS --- */}
                {/* 1. Carteira conectada (Mobile only) */}
                <div className="flex md:hidden flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading text-base font-bold text-text-primary">
                      Carteira conectada
                    </h3>
                    <button type="button" className="text-sm font-medium text-primary hover:underline">
                      Trocar carteira
                    </button>
                  </div>
                  <div className="flex flex-col gap-3">
                    {wallets?.map((wallet) => (
                      <Label
                        key={`mobile-connected-${wallet.id}`}
                        htmlFor={`mobile-connected-${wallet.id}`}
                        className={`flex w-full cursor-pointer items-center justify-between rounded-xl bg-surface-card p-4 text-left transition-colors`}
                      >
                        <div className="flex items-center gap-4">
                          <RadioGroupItem
                            value={wallet.id}
                            id={`mobile-connected-${wallet.id}`}
                            className="text-primary data-[state=checked]:border-primary"
                          />
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-text-primary">
                              {wallet.name || "Carteira"}
                            </span>
                            <span className="text-xs text-text-secondary mt-1">
                              {wallet.address.length > 12 ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}` : wallet.address}
                            </span>
                            <span className="text-xs text-text-secondary">
                              Rede {wallet.network === "ethereum" ? "principal Ethereum" : wallet.network === "polygon" ? "Polygon" : wallet.network}
                            </span>
                          </div>
                        </div>
                        <button type="button" className="text-text-secondary p-1">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                        </button>
                      </Label>
                    ))}
                  </div>
                </div>

                {/* 2. Carteira e rede (Mobile Providers) */}
                <div className="flex md:hidden flex-col gap-4">
                  <h3 className="font-heading text-base font-bold text-text-primary">
                    Carteira e rede
                  </h3>
                  <div className="flex flex-col gap-3">
                    {/* WalletConnect */}
                    <Label
                      htmlFor="mobile-walletconnect"
                      className={`flex w-full cursor-pointer items-center justify-between rounded-xl bg-surface-card p-4 text-left transition-colors`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex size-10 items-center justify-center rounded-full bg-surface-raised border border-border font-bold text-primary">
                          W
                        </div>
                        <span className="text-sm font-bold text-text-primary">
                          WalletConnect
                        </span>
                      </div>
                      <RadioGroupItem
                        value="walletconnect"
                        id="mobile-walletconnect"
                        className="text-primary data-[state=checked]:border-primary"
                      />
                    </Label>

                    {/* MetaMask */}
                    <Label
                      htmlFor="mobile-metamask"
                      className={`flex w-full cursor-pointer items-center justify-between rounded-xl bg-surface-card p-4 text-left transition-colors`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex size-10 items-center justify-center rounded-full bg-surface-raised border border-border font-bold text-primary">
                          M
                        </div>
                        <span className="text-sm font-bold text-text-primary">
                          MetaMask
                        </span>
                      </div>
                      <RadioGroupItem
                        value="metamask"
                        id="mobile-metamask"
                        className="text-primary data-[state=checked]:border-primary"
                      />
                    </Label>

                    {/* Coinbase Wallet */}
                    <Label
                      htmlFor="mobile-coinbase"
                      className={`flex w-full cursor-pointer items-center justify-between rounded-xl bg-surface-card p-4 text-left transition-colors`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex size-10 items-center justify-center rounded-full bg-surface-raised border border-border text-primary">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg>
                        </div>
                        <span className="text-sm font-bold text-text-primary">
                          Coinbase Wallet
                        </span>
                      </div>
                      <RadioGroupItem
                        value="coinbase"
                        id="mobile-coinbase"
                        className="text-primary data-[state=checked]:border-primary"
                      />
                    </Label>
                  </div>
                </div>

                {/* --- DESKTOP SECTION --- */}
                <div className="hidden md:flex flex-col gap-3">
                  <Label
                    htmlFor="wallet-group"
                    className={`flex w-full cursor-pointer items-center gap-3 rounded border px-4 py-2 text-left transition-colors hover:border-primary/50 ${selectedWalletId === "wallet-group" ? "border-primary bg-primary/10" : "border-border-soft/40 bg-black/40"}`}
                  >
                    <RadioGroupItem
                      value="wallet-group"
                      id="wallet-group"
                      className="text-primary data-[state=checked]:border-primary"
                    />
                    <div className="inline-flex items-center gap-2.5 whitespace-nowrap rounded-sm border border-border-soft bg-surface-dark p-2 text-xs font-bold tracking-widest text-text-accent">
                      <span>METAMASK</span>
                      <span className="text-[10px] text-text-accent">•</span>
                      <span>WALLETCONNECT</span>
                      <span className="text-[10px] text-text-accent">•</span>
                      <span>COINBASE</span>
                    </div>
                  </Label>

                  {wallets?.map((wallet) => (
                    <Label
                      key={`desktop-${wallet.id}`}
                      htmlFor={`desktop-${wallet.id}`}
                      className={`flex w-full cursor-pointer items-center gap-3 rounded border p-4 text-left transition-colors hover:border-primary/50 ${selectedWalletId === wallet.id ? "border-primary bg-primary/10" : "border-border-soft/40 bg-black/40"}`}
                    >
                      <RadioGroupItem
                        value={wallet.id}
                        id={`desktop-${wallet.id}`}
                        className="text-primary data-[state=checked]:border-primary"
                      />
                      <span className="text-sm font-medium text-text-primary">
                        {wallet.name || "Carteira"}
                      </span>
                    </Label>
                  ))}
                </div>
              </RadioGroup>

              <div className="md:mt-0">
                {/* Mobile Total */}
                <div className="mb-4 flex md:hidden items-center justify-end gap-7 font-heading text-xl font-bold">
                  <span className="text-text-primary">Total:</span>
                  <span className="text-primary tabular-nums font-mono text-xl">
                    {formatEth(quote.totalEth)}
                  </span>
                </div>

                <Button
                  className="h-12 w-full rounded-full bg-primary font-bold text-ink hover:bg-primary/90 md:rounded-md"
                  disabled={!canSubmit || createOrder.isPending}
                  onClick={handleSubmit}
                >
                  {createOrder.isPending ? "Processando…" : "Confirmar compra"}
                </Button>
                {hasBlockingIssues && (
                  <p className="mt-2 text-center text-xs text-error">
                    Resolva os problemas do carrinho antes de continuar.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
