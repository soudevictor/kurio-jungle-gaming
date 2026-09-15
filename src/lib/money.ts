import Decimal from "decimal.js"

/**
 * ETH values are exchanged as decimal strings across the whole app (API
 * contracts, cart, quote, order snapshots). These helpers centralize every
 * arithmetic/formatting operation so precision never depends on `number`.
 */

Decimal.set({ precision: 40, rounding: Decimal.ROUND_DOWN })

export function toDecimal(value: string | number): Decimal {
  return new Decimal(value)
}

export function add(...values: string[]): string {
  return values
    .reduce((acc, v) => acc.plus(v), new Decimal(0))
    .toFixed(18)
    .replace(/0+$/, "")
    .replace(/\.$/, "")
}

export function multiply(value: string, factor: number | string): string {
  return new Decimal(value)
    .times(factor)
    .toFixed(18)
    .replace(/0+$/, "")
    .replace(/\.$/, "")
}

export function subtract(a: string, b: string): string {
  const result = new Decimal(a).minus(b)
  return (result.isNegative() ? new Decimal(0) : result)
    .toFixed(18)
    .replace(/0+$/, "")
    .replace(/\.$/, "")
}

export function isZero(value: string): boolean {
  return new Decimal(value).isZero()
}

export function compare(a: string, b: string): number {
  return new Decimal(a).comparedTo(b)
}

/** Formats an ETH decimal string for display, e.g. "0.05" -> "0.05 ETH". */
export function formatEth(value: string, options?: { withSuffix?: boolean }): string {
  const d = new Decimal(value)
  const fixed = d.toDecimalPlaces(4, Decimal.ROUND_DOWN).toString()
  const withSuffix = options?.withSuffix ?? true
  return withSuffix ? `${fixed} ETH` : fixed
}

export function formatUsdApprox(ethValue: string, ethUsdRate = 3200): string {
  const usd = new Decimal(ethValue).times(ethUsdRate)
  return usd.toDecimalPlaces(2, Decimal.ROUND_DOWN).toNumber().toLocaleString("pt-BR", {
    style: "currency",
    currency: "USD",
  })
}
