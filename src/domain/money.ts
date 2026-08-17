export const supportedCurrencies = ["SAR"] as const

export type Currency = (typeof supportedCurrencies)[number]

export interface Money {
  readonly amountMinor: number
  readonly currency: Currency
}

export function parseMoneyInputToMinor(value: string): number | null {
  const normalizedValue = value.trim()

  if (!/^\d+(?:\.\d{1,2})?$/.test(normalizedValue)) {
    return null
  }

  const [wholePart, fractionPart = ""] = normalizedValue.split(".")
  const wholeMinor = Number(wholePart) * 100
  const fractionMinor = Number(fractionPart.padEnd(2, "0"))
  const amountMinor = wholeMinor + fractionMinor

  return Number.isSafeInteger(amountMinor) ? amountMinor : null
}

export function createMoneyFromMinor(
  amountMinor: number,
  currency: Currency
): Money {
  if (!Number.isSafeInteger(amountMinor) || amountMinor < 0) {
    throw new RangeError("Money minor units must be a non-negative integer.")
  }

  return { amountMinor, currency }
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
