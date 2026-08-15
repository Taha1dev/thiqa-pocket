import type { Money } from "@/domain/money/money"

export interface WalletUser {
  readonly id: string
  readonly name: string
  readonly phone: string
  readonly balance: Money
}
