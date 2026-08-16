import type { Money } from "@/domain/money/money"

export const TRANSFER_LIMITS = {
  minMinor: 1_000,
  maxMinor: 1_000_000,
} as const

export const TOP_UP_LIMITS = {
  minMinor: 5_000,
  maxMinor: 2_000_000,
} as const

export const TOP_UP_PRESETS_MINOR = [10_000, 25_000, 50_000, 100_000] as const

export const TRANSFER_FIELD_LIMITS = {
  recipientNameMin: 2,
  recipientNameMax: 80,
  noteMax: 140,
} as const

export const SAUDI_IBAN_PATTERN = /^SA\d{22}$/

export function normalizeSaudiIban(value: string): string {
  return value.replace(/\s+/g, "").toUpperCase()
}

export function formatSaudiIban(value: string): string {
  return (
    normalizeSaudiIban(value)
      .match(/.{1,4}/g)
      ?.join(" ") ?? value
  )
}

export function maskSaudiIban(value: string): string {
  const normalized = normalizeSaudiIban(value)

  if (normalized.length < 8) {
    return normalized
  }

  return `${normalized.slice(0, 4)} •••• •••• •••• •••• ${normalized.slice(-4)}`
}

export interface TransferCommand {
  readonly amount: Money
  readonly currentBalance: Money
  readonly recipientName: string
  readonly iban: string
  readonly note: string | null
}

export interface TransferReceipt {
  readonly kind: "transfer"
  readonly transactionId: string
  readonly status: "completed"
  readonly amount: Money
  readonly balanceAfter: Money
  readonly recipientName: string
  readonly iban: string
  readonly note: string | null
  readonly timestamp: string
}

export type TopUpSource = "bank_transfer"

export interface TopUpCommand {
  readonly amount: Money
  readonly currentBalance: Money
  readonly source: TopUpSource
}

export interface TopUpReceipt {
  readonly kind: "top_up"
  readonly transactionId: string
  readonly status: "completed"
  readonly amount: Money
  readonly balanceAfter: Money
  readonly source: TopUpSource
  readonly timestamp: string
}
