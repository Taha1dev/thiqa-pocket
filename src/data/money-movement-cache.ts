import type { QueryClient } from "@tanstack/react-query"

import { walletQueryKey } from "@/data/wallet-queries"
import type { TopUpReceipt, TransferReceipt } from "@/domain/money-movement"
import type { Transaction } from "@/domain/transaction"
import type { WalletData, WalletUser } from "@/domain/wallet"

function applyReceiptToCache(
  queryClient: QueryClient,
  balance: WalletUser["balance"],
  transaction: Transaction
): void {
  queryClient.setQueryData<WalletData>(walletQueryKey, (data) =>
    data
      ? {
          wallet: { ...data.wallet, balance },
          transactions: [transaction, ...data.transactions],
        }
      : data
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

  applyReceiptToCache(queryClient, receipt.balanceAfter, transaction)
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

  applyReceiptToCache(queryClient, receipt.balanceAfter, transaction)
  return transaction
}
