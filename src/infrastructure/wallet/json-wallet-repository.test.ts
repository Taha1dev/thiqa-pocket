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

function createControlledRepository() {
  let resolveResponse: ((response: Response) => void) | undefined
  const fetcher = vi.fn<typeof fetch>()
  fetcher.mockImplementation(
    () =>
      new Promise<Response>((resolve) => {
        resolveResponse = resolve
      })
  )

  return {
    repository: new JsonWalletRepository({ delayMs: 0, fetcher }),
    fetcher,
    resolve: () => {
      if (!resolveResponse) {
        throw new Error("The controlled request has not started.")
      }

      resolveResponse(
        new Response(JSON.stringify(validData), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    },
  }
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

  it("coalesces concurrent reads of the combined wallet response", async () => {
    const { repository, fetcher, resolve } = createControlledRepository()

    const wallet = repository.getWallet()
    const transactions = repository.getTransactions()

    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1))
    resolve()

    await expect(wallet).resolves.toMatchObject({ id: "usr_test" })
    await expect(transactions).resolves.toHaveLength(1)
  })

  it("keeps a shared read alive while another consumer remains", async () => {
    const { repository, fetcher, resolve } = createControlledRepository()
    const controller = new AbortController()

    const cancelledWallet = repository.getWallet(controller.signal)
    const transactions = repository.getTransactions()
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1))
    controller.abort()
    resolve()

    await expect(cancelledWallet).rejects.toMatchObject({ name: "AbortError" })
    await expect(transactions).resolves.toHaveLength(1)
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it("aborts the shared request when every consumer cancels", async () => {
    const request = { signal: undefined as AbortSignal | undefined }
    const fetcher = vi.fn<typeof fetch>()
    fetcher.mockImplementation((_input, init) => {
      request.signal = init?.signal ?? undefined

      return new Promise<Response>((_resolve, reject) => {
        request.signal?.addEventListener(
          "abort",
          () => reject(request.signal?.reason),
          { once: true }
        )
      })
    })
    const repository = new JsonWalletRepository({ delayMs: 0, fetcher })
    const walletController = new AbortController()
    const transactionsController = new AbortController()

    const wallet = repository.getWallet(walletController.signal)
    const transactions = repository.getTransactions(
      transactionsController.signal
    )
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1))
    walletController.abort()
    transactionsController.abort()

    await expect(wallet).rejects.toMatchObject({ name: "AbortError" })
    await expect(transactions).rejects.toMatchObject({ name: "AbortError" })
    expect(request.signal?.aborted).toBe(true)
  })

  it("throws a typed error for unknown transaction IDs", async () => {
    const repository = createRepository()

    await expect(
      repository.getTransactionById("txn_missing")
    ).rejects.toBeInstanceOf(EntityNotFoundError)
  })
})
