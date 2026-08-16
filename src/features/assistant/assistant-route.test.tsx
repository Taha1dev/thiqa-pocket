import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { createMoney } from "@/domain/money/money"
import type { Transaction } from "@/domain/transaction/transaction"
import type { WalletUser } from "@/domain/wallet/wallet"
import { Component as AssistantRoute } from "@/features/assistant/assistant-route"
import i18n from "@/i18n/config"
import { walletRepository } from "@/infrastructure/wallet/json-wallet-repository"
import { RequestError } from "@/shared/errors/request-error"

const wallet: WalletUser = {
  id: "usr_test",
  name: "Sara Al-Otaibi",
  phone: "+966500000000",
  balance: createMoney(4285.5, "SAR"),
}

const transactions: readonly Transaction[] = [
  {
    id: "txn_completed",
    type: "debit",
    category: "transfer",
    amount: createMoney(250, "SAR"),
    counterpartyName: "Ahmed Al-Harbi",
    counterpartyAccount: null,
    status: "completed",
    timestamp: "2026-08-12T14:32:00+03:00",
    note: null,
  },
]

function renderRoute(): void {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  render(
    <QueryClientProvider client={queryClient}>
      <AssistantRoute />
    </QueryClientProvider>
  )
}

beforeEach(async () => {
  await i18n.changeLanguage("en")
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("assistant route data states", () => {
  it("renders a wallet-context skeleton while queries are pending", () => {
    vi.spyOn(walletRepository, "getWallet").mockReturnValue(
      new Promise(() => undefined)
    )
    vi.spyOn(walletRepository, "getTransactions").mockReturnValue(
      new Promise(() => undefined)
    )

    renderRoute()

    expect(screen.getByRole("status")).toHaveTextContent(
      "Loading your wallet context..."
    )
  })

  it("renders an actionable inline error when wallet context is unavailable", async () => {
    vi.spyOn(walletRepository, "getWallet").mockRejectedValue(
      new RequestError("Unavailable")
    )
    vi.spyOn(walletRepository, "getTransactions").mockResolvedValue(
      transactions
    )

    renderRoute()

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Your wallet activity is temporarily unavailable."
    )
    expect(
      screen.getByRole("button", { name: "Try loading again" })
    ).toBeInTheDocument()
  })

  it("renders the chat after wallet context loads", async () => {
    vi.spyOn(walletRepository, "getWallet").mockResolvedValue(wallet)
    vi.spyOn(walletRepository, "getTransactions").mockResolvedValue(
      transactions
    )

    renderRoute()

    expect(
      await screen.findByText("Your wallet, explained.")
    ).toBeInTheDocument()
  })
})
