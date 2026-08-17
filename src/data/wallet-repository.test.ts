import { describe, expect, it, vi } from "vitest"

import { JsonWalletRepository } from "@/data/wallet-repository"
import { DataValidationError, RequestError } from "@/shared/errors"

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

function createJsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

describe("JsonWalletRepository", () => {
  it("validates and maps the complete wallet snapshot in one request", async () => {
    const fetcher = vi.fn<typeof fetch>()
    fetcher.mockResolvedValue(createJsonResponse(validData))
    const repository = new JsonWalletRepository({ delayMs: 0, fetcher })

    await expect(repository.getWalletData()).resolves.toMatchObject({
      wallet: { balance: { amountMinor: 428550, currency: "SAR" } },
      transactions: [{ amount: { amountMinor: 7620, currency: "SAR" } }],
    })
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it("rejects data that does not match the runtime schema", async () => {
    const repository = new JsonWalletRepository({
      delayMs: 0,
      fetcher: vi.fn<typeof fetch>().mockResolvedValue(createJsonResponse({})),
    })

    await expect(repository.getWalletData()).rejects.toBeInstanceOf(
      DataValidationError
    )
  })

  it("preserves request status for failed responses", async () => {
    const repository = new JsonWalletRepository({
      delayMs: 0,
      fetcher: vi
        .fn<typeof fetch>()
        .mockResolvedValue(createJsonResponse({}, 503)),
    })

    await expect(repository.getWalletData()).rejects.toMatchObject({
      status: 503,
    } satisfies Partial<RequestError>)
  })

  it("passes the consumer AbortSignal to fetch", async () => {
    const fetcher = vi.fn<typeof fetch>()
    fetcher.mockResolvedValue(createJsonResponse(validData))
    const repository = new JsonWalletRepository({ delayMs: 0, fetcher })
    const controller = new AbortController()

    await repository.getWalletData(controller.signal)

    expect(fetcher).toHaveBeenCalledWith("/mock_data.json", {
      signal: controller.signal,
    })
  })
})
