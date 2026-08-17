import { QueryClient } from "@tanstack/react-query"
import { describe, expect, it } from "vitest"

import { createMoney } from "@/domain/money"
import type { WalletData, WalletUser } from "@/domain/wallet"
import {
  applyTopUpReceiptToCache,
  applyTransferReceiptToCache,
} from "@/data/money-movement-cache"
import { MockMoneyMovementRepository } from "@/data/money-movement-repository"
import { walletQueryKey } from "@/data/wallet-queries"

const wallet: WalletUser = {
  id: "usr_test",
  name: "Sara Al-Otaibi",
  phone: "+966500000000",
  balance: createMoney(4285.5, "SAR"),
}

function createQueryClient(): QueryClient {
  const queryClient = new QueryClient()
  queryClient.setQueryData<WalletData>(walletQueryKey, {
    wallet,
    transactions: [],
  })
  return queryClient
}

describe("money-movement cache updates", () => {
  it("creates a debit transaction and decreases the cached wallet balance", async () => {
    const queryClient = createQueryClient()
    const repository = new MockMoneyMovementRepository({
      delayMs: 0,
      createId: () => "txn_transfer_test",
      now: () => new Date("2026-08-16T10:00:00.000Z"),
    })
    const receipt = await repository.transfer({
      amount: createMoney(250, "SAR"),
      currentBalance: wallet.balance,
      recipientName: "Ahmed Al-Harbi",
      iban: "sa03 8000 0000 6080 1016 7519",
      note: "Rent share",
    })

    const transaction = applyTransferReceiptToCache(queryClient, receipt)

    expect(transaction).toMatchObject({
      id: "txn_transfer_test",
      type: "debit",
      category: "transfer",
      counterpartyAccount: "SA0380000000608010167519",
    })
    expect(
      queryClient.getQueryData<WalletData>(walletQueryKey)?.wallet.balance
        .amountMinor
    ).toBe(403_550)
    expect(
      queryClient.getQueryData<WalletData>(walletQueryKey)?.transactions[0]
    ).toEqual(transaction)
  })

  it("creates a credit top-up transaction and increases the cached balance", async () => {
    const queryClient = createQueryClient()
    const repository = new MockMoneyMovementRepository({
      delayMs: 0,
      createId: () => "txn_top_up_test",
      now: () => new Date("2026-08-16T10:00:00.000Z"),
    })
    const receipt = await repository.topUp({
      amount: createMoney(500, "SAR"),
      currentBalance: wallet.balance,
      source: "bank_transfer",
    })

    const transaction = applyTopUpReceiptToCache(
      queryClient,
      receipt,
      "Bank transfer"
    )

    expect(transaction).toMatchObject({
      id: "txn_top_up_test",
      type: "credit",
      category: "top_up",
      counterpartyName: "Bank transfer",
    })
    expect(
      queryClient.getQueryData<WalletData>(walletQueryKey)?.wallet.balance
        .amountMinor
    ).toBe(478_550)
    expect(
      queryClient.getQueryData<WalletData>(walletQueryKey)?.transactions[0]
    ).toEqual(transaction)
  })
})
