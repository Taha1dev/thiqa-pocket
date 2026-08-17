import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { routePaths } from "@/app/routes/paths"
import { createMoneyFromMinor } from "@/domain/money"
import type { Transaction } from "@/domain/transaction"
import type { WalletRepository } from "@/data/wallet-repository"
import type { WalletUser } from "@/domain/wallet"
import { TransactionPage } from "@/features/transactions/page"
import i18n from "@/i18n/config"
import { walletQueryKey } from "@/data/wallet-queries"

const wallet: WalletUser = {
  id: "usr_1001",
  name: "Sara Al-Otaibi",
  phone: "+966501234567",
  balance: createMoneyFromMinor(428_550, "SAR"),
}

const transaction: Transaction = {
  id: "txn_1001",
  type: "debit",
  category: "transfer",
  amount: createMoneyFromMinor(25_000, "SAR"),
  counterpartyName: "Ahmed Al-Harbi",
  counterpartyAccount: "SA0380000000608010167519",
  status: "completed",
  timestamp: "2026-08-12T14:32:00+03:00",
  note: "Rent share",
}

function createRepository(): WalletRepository {
  return {
    getWalletData: async () => ({ wallet, transactions: [transaction] }),
  }
}

function TestRoutes({ repository }: { readonly repository: WalletRepository }) {
  return (
    <Routes>
      <Route
        path={routePaths.transaction}
        element={<TransactionPage repository={repository} />}
      />
    </Routes>
  )
}

function renderRoute({
  initialEntry,
  repository = createRepository(),
  seedTransaction,
}: {
  readonly initialEntry: string
  readonly repository?: WalletRepository
  readonly seedTransaction?: Transaction
}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Number.POSITIVE_INFINITY },
    },
  })
  if (seedTransaction) {
    queryClient.setQueryData(walletQueryKey, {
      wallet,
      transactions: [seedTransaction],
    })
  }

  const result = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <TestRoutes repository={repository} />
      </MemoryRouter>
    </QueryClientProvider>
  )

  return { ...result, queryClient }
}

describe("transaction detail route", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en")
  })

  it("renders a direct URL as a standalone transaction page", async () => {
    renderRoute({ initialEntry: "/transactions/txn_1001" })

    expect(
      await screen.findByRole("heading", { name: "Ahmed Al-Harbi" })
    ).toBeVisible()
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Transaction information",
      })
    ).toBeVisible()
    expect(
      screen.getByRole("link", { name: "Back to activity" })
    ).toHaveAttribute("href", "/dashboard")
  })

  it("keeps a transaction-shaped skeleton visible during loading", () => {
    const repository: WalletRepository = {
      getWalletData: () => new Promise(() => undefined),
    }
    const { container } = renderRoute({
      initialEntry: "/transactions/txn_pending_request",
      repository,
    })

    expect(
      container.querySelectorAll('[data-slot="skeleton"]')
    ).not.toHaveLength(0)
    expect(screen.getByRole("status")).toHaveClass("sr-only")
    expect(screen.getByRole("status")).toHaveTextContent("Loading…")
  })

  it("renders a typed not-found state", async () => {
    renderRoute({ initialEntry: "/transactions/not-real" })

    expect(
      await screen.findByRole("heading", { name: "Transaction not found" })
    ).toBeVisible()
    expect(
      screen.getByText(
        "This transaction does not exist or is no longer available."
      )
    ).toBeVisible()
  })

  it.each([
    ["txn_generated_transfer", "debit", "transfer", "New recipient"],
    ["txn_generated_top_up", "credit", "top_up", "Bank Transfer"],
  ] as const)(
    "resolves the session-generated %s transaction from Query cache",
    async (id, type, category, counterpartyName) => {
      const generatedTransaction: Transaction = {
        ...transaction,
        id,
        type,
        category,
        counterpartyName,
        counterpartyAccount:
          type === "credit" ? null : transaction.counterpartyAccount,
      }
      const getWalletData = vi.fn(async () => ({
        wallet,
        transactions: [transaction],
      }))
      renderRoute({
        initialEntry: `/transactions/${id}`,
        repository: { getWalletData },
        seedTransaction: generatedTransaction,
      })

      expect(
        await screen.findByRole("heading", { name: counterpartyName })
      ).toBeVisible()
      expect(getWalletData).not.toHaveBeenCalled()
    }
  )
})
