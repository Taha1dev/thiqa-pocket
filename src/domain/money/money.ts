export const supportedCurrencies = ["SAR"] as const

export type Currency = (typeof supportedCurrencies)[number]

export interface Money {
  readonly amountMinor: number
  readonly currency: Currency
}

export function toMinorUnits(amountMajor: number): number {
  const amountMinor = Math.round(amountMajor * 100)

  if (!Number.isSafeInteger(amountMinor)) {
    throw new RangeError(
      "Money amount exceeds the supported safe-integer range."
    )
  }

  return amountMinor
}

export function createMoney(amountMajor: number, currency: Currency): Money {
  return {
    amountMinor: toMinorUnits(amountMajor),
    currency,
  }
}
