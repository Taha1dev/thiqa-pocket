import type { Transaction } from "@/domain/transaction/transaction"
import type { WalletUser } from "@/domain/wallet/wallet"

export interface WalletRepository {
  getWallet(signal?: AbortSignal): Promise<WalletUser>
  getTransactions(signal?: AbortSignal): Promise<readonly Transaction[]>
  getTransactionById(id: string, signal?: AbortSignal): Promise<Transaction>
}
