import type { Money } from "@/domain/money"

export const transactionTypes = ["debit", "credit"] as const
export const transactionCategories = [
  "transfer",
  "top_up",
  "bill_payment",
  "purchase",
  "refund",
] as const
export const transactionStatuses = ["completed", "pending", "failed"] as const

export type TransactionType = (typeof transactionTypes)[number]
export type TransactionCategory = (typeof transactionCategories)[number]
export type TransactionStatus = (typeof transactionStatuses)[number]

export interface Transaction {
  readonly id: string
  readonly type: TransactionType
  readonly category: TransactionCategory
  readonly amount: Money
  readonly counterpartyName: string
  readonly counterpartyAccount: string | null
  readonly status: TransactionStatus
  readonly timestamp: string
  readonly note: string | null
}
