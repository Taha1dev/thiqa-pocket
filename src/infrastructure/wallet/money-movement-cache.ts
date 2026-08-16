import type { QueryClient } from "@tanstack/react-query"

import type {
  TopUpReceipt,
  TransferReceipt,
} from "@/domain/money-movement/money-movement"
import type { Transaction } from "@/domain/transaction/transaction"
import type { WalletUser } from "@/domain/wallet/wallet"
import { walletQueryKeys } from "@/infrastructure/wallet/wallet-queries"

function updateWalletBalance(
  queryClient: QueryClient,
  balance: WalletUser["balance"]
): void {
  queryClient.setQueryData<WalletUser>(walletQueryKeys.wallet, (wallet) =>
    wallet ? { ...wallet, balance } : wallet
  )
}

function prependTransaction(
  queryClient: QueryClient,
  transaction: Transaction
): void {
  queryClient.setQueryData<readonly Transaction[]>(
    walletQueryKeys.transactions,
    (transactions) => [transaction, ...(transactions ?? [])]
  )
  queryClient.setQueryData(
    walletQueryKeys.transaction(transaction.id),
    transaction
  )
}

export function applyTransferReceiptToCache(
  queryClient: QueryClient,
  receipt: TransferReceipt
): Transaction {
  const transaction: Transaction = {
    id: receipt.transactionId,
    type: "debit",
    category: "transfer",
    amount: receipt.amount,
    counterpartyName: receipt.recipientName,
    counterpartyAccount: receipt.iban,
    status: receipt.status,
    timestamp: receipt.timestamp,
    note: receipt.note,
  }

  updateWalletBalance(queryClient, receipt.balanceAfter)
  prependTransaction(queryClient, transaction)
  return transaction
}

export function applyTopUpReceiptToCache(
  queryClient: QueryClient,
  receipt: TopUpReceipt,
  sourceName: string
): Transaction {
  const transaction: Transaction = {
    id: receipt.transactionId,
    type: "credit",
    category: "top_up",
    amount: receipt.amount,
    counterpartyName: sourceName,
    counterpartyAccount: null,
    status: receipt.status,
    timestamp: receipt.timestamp,
    note: null,
  }

  updateWalletBalance(queryClient, receipt.balanceAfter)
  prependTransaction(queryClient, transaction)
  return transaction
}
