import { afterEach, describe, expect, it, vi } from "vitest"

import { createMoney } from "@/domain/money"
import type { Transaction } from "@/domain/transaction"
import type { WalletUser } from "@/domain/wallet"
import { createHttpAssistantProvider } from "@/data/assistant-client"
import { RequestError } from "@/shared/errors/errors"

const wallet: WalletUser = {
  id: "usr_test",
  name: "Sara Al-Otaibi",
  phone: "+966500000000",
  balance: createMoney(4285.5, "SAR"),
}

const transactions: readonly Transaction[] = [
  {
    id: "txn_test",
    type: "debit",
    category: "transfer",
    amount: createMoney(250, "SAR"),
    counterpartyName: "Ahmed Al-Harbi",
    counterpartyAccount: "SA0380000000608010167519",
    status: "completed",
    timestamp: "2026-08-12T14:32:00+03:00",
    note: "Rent share",
  },
]

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("HttpAssistantProvider", () => {
  it("sends only the wallet and transaction fields needed for analysis", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        answer: "You spent SAR 250.00 on completed transfers this month.",
      })
    )
    vi.stubGlobal("fetch", fetcher)
    const provider = createHttpAssistantProvider("/api/assistant-test")

    await provider.ask({
      question: "How much did I spend?",
      locale: "ar-SA",
      wallet,
      transactions,
    })

    const requestInit = fetcher.mock.calls[0]?.[1]
    const body = JSON.parse(String(requestInit?.body)) as unknown

    expect(fetcher).toHaveBeenCalledWith(
      "/api/assistant-test",
      expect.objectContaining({ method: "POST" })
    )
    expect(body).toEqual({
      question: "How much did I spend?",
      locale: "ar",
      wallet: {
        balanceMinor: 428550,
        currency: "SAR",
      },
      transactions: [
        {
          type: "debit",
          category: "transfer",
          amountMinor: 25000,
          currency: "SAR",
          status: "completed",
          timestamp: "2026-08-12T14:32:00+03:00",
          counterpartyName: "Ahmed Al-Harbi",
        },
      ],
    })
    expect(JSON.stringify(body)).not.toContain(wallet.phone)
    expect(JSON.stringify(body)).not.toContain(
      transactions[0]?.counterpartyAccount
    )
    expect(JSON.stringify(body)).not.toContain("Rent share")
  })

  it("throws RequestError for non-success and invalid responses", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({}, { status: 503 }))
      .mockResolvedValueOnce(Response.json({ answer: "" }))
    vi.stubGlobal("fetch", fetcher)
    const provider = createHttpAssistantProvider()
    const request = {
      question: "Summarize my wallet.",
      locale: "en",
      wallet,
      transactions,
    }

    await expect(provider.ask(request)).rejects.toMatchObject({
      name: "RequestError",
      status: 503,
    })
    await expect(provider.ask(request)).rejects.toBeInstanceOf(RequestError)
  })

  it("preserves deliberate request cancellation", async () => {
    const abortError = new DOMException("Aborted", "AbortError")
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockRejectedValue(abortError))
    const provider = createHttpAssistantProvider()

    await expect(
      provider.ask({
        question: "Summarize my wallet.",
        locale: "en",
        wallet,
        transactions,
      })
    ).rejects.toBe(abortError)
  })
})
