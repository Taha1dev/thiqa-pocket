import type { Money } from "@/domain/money"
import type { Transaction } from "@/domain/transaction"

export interface WalletUser {
  readonly id: string
  readonly name: string
  readonly phone: string
  readonly balance: Money
}

export interface WalletData {
  readonly wallet: WalletUser
  readonly transactions: readonly Transaction[]
}
