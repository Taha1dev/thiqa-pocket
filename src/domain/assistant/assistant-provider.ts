import type { Transaction } from "@/domain/transaction/transaction"
import type { WalletUser } from "@/domain/wallet/wallet"

export interface AssistantRequest {
  readonly question: string
  readonly locale: string
  readonly wallet: WalletUser
  readonly transactions: readonly Transaction[]
}

export interface AssistantResponse {
  readonly answer: string
}

export interface AssistantProvider {
  ask(
    request: AssistantRequest,
    signal?: AbortSignal
  ): Promise<AssistantResponse>
}
