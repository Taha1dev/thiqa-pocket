import { queryOptions } from "@tanstack/react-query"

import type { WalletRepository } from "@/data/wallet-repository"
import { EntityNotFoundError } from "@/shared/errors/errors"

export const walletQueryKey = ["wallet-data"] as const

export function walletDataQueryOptions(repository: WalletRepository) {
  return queryOptions({
    queryKey: walletQueryKey,
    queryFn: ({ signal }) => repository.getWalletData(signal),
  })
}

export function transactionQueryOptions(
  repository: WalletRepository,
  id: string
) {
  return queryOptions({
    ...walletDataQueryOptions(repository),
    select: (data) => {
      const transaction = data.transactions.find((item) => item.id === id)

      if (!transaction) {
        throw new EntityNotFoundError("transaction", id)
      }

      return transaction
    },
  })
}
