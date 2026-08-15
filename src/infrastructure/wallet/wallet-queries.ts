import { queryOptions } from "@tanstack/react-query"

import type { WalletRepository } from "@/domain/wallet/wallet-repository"

export const walletQueryKeys = {
  wallet: ["wallet"] as const,
  transactions: ["transactions"] as const,
  transaction: (id: string) => ["transactions", id] as const,
}

export function walletQueryOptions(repository: WalletRepository) {
  return queryOptions({
    queryKey: walletQueryKeys.wallet,
    queryFn: ({ signal }) => repository.getWallet(signal),
  })
}

export function transactionsQueryOptions(repository: WalletRepository) {
  return queryOptions({
    queryKey: walletQueryKeys.transactions,
    queryFn: ({ signal }) => repository.getTransactions(signal),
  })
}

export function transactionQueryOptions(
  repository: WalletRepository,
  id: string
) {
  return queryOptions({
    queryKey: walletQueryKeys.transaction(id),
    queryFn: ({ signal }) => repository.getTransactionById(id, signal),
  })
}
