import { describe, expect, it, vi } from "vitest"

import { JsonWalletRepository } from "@/infrastructure/wallet/json-wallet-repository"
import { EntityNotFoundError } from "@/shared/errors/entity-not-found-error"

const validData = {
  user: {
    id: "usr_test",
    name: "Test User",
    phone: "+966500000000",
    walletBalance: 4285.5,
    currency: "SAR",
  },
  transactions: [
    {
      id: "txn_test",
      type: "debit",
      category: "purchase",
      amount: 76.2,
      counterpartyName: "Test Merchant",
      counterpartyAccount: null,
      status: "completed",
      timestamp: "2026-08-10T12:05:00+03:00",
      note: null,
    },
  ],
}

function createRepository(): JsonWalletRepository {
  const fetcher = vi.fn<typeof fetch>()
  fetcher.mockImplementation(() =>
    Promise.resolve(
      new Response(JSON.stringify(validData), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    )
  )

  return new JsonWalletRepository({ delayMs: 0, fetcher })
}

describe("JsonWalletRepository", () => {
  it("maps decimal amounts to integer minor units", async () => {
    const repository = createRepository()

    await expect(repository.getWallet()).resolves.toMatchObject({
      balance: { amountMinor: 428550, currency: "SAR" },
    })
    await expect(repository.getTransactions()).resolves.toMatchObject([
      { amount: { amountMinor: 7620, currency: "SAR" } },
    ])
  })

  it("throws a typed error for unknown transaction IDs", async () => {
    const repository = createRepository()

    await expect(
      repository.getTransactionById("txn_missing")
    ).rejects.toBeInstanceOf(EntityNotFoundError)
  })
})
