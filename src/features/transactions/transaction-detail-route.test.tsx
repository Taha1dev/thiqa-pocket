import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Link, MemoryRouter, Route, Routes, useLocation } from "react-router"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getTransactionPath, routePaths } from "@/app/router/paths"
import { createMoneyFromMinor } from "@/domain/money/money"
import type { Transaction } from "@/domain/transaction/transaction"
import type { WalletRepository } from "@/domain/wallet/wallet-repository"
import type { WalletUser } from "@/domain/wallet/wallet"
import { DashboardContent } from "@/features/dashboard/dashboard-content"
import { TransactionDetailRoute } from "@/features/transactions/transaction-detail-route"
import { TransactionPresentationProvider } from "@/features/transactions/transaction-presentation"
import i18n from "@/i18n/config"
import { EntityNotFoundError } from "@/shared/errors/entity-not-found-error"
import { walletQueryKeys } from "@/infrastructure/wallet/wallet-queries"

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

function createRepository(
  getTransactionById: WalletRepository["getTransactionById"] = async (id) => {
    if (id !== transaction.id) {
      throw new EntityNotFoundError("transaction", id)
    }
    return transaction
  }
): WalletRepository {
  return {
    getWallet: async () => wallet,
    getTransactions: async () => [transaction],
    getTransactionById,
  }
}

function LocationProbe() {
  const location = useLocation()
  return <div data-testid="location">{location.pathname}</div>
}

function TestRoutes({ repository }: { readonly repository: WalletRepository }) {
  const dashboard = (
    <DashboardContent
      locale="en"
      transactions={[transaction]}
      wallet={wallet}
    />
  )

  return (
    <>
      <LocationProbe />
      <Routes>
        <Route path={routePaths.dashboard} element={dashboard} />
        <Route
          path={routePaths.transaction}
          element={
            <TransactionDetailRoute
              contextualBackground={dashboard}
              repository={repository}
            />
          }
        />
        <Route
          path="/link-only"
          element={<Link to={getTransactionPath(transaction.id)}>Open</Link>}
        />
      </Routes>
    </>
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
    queryClient.setQueryData(
      walletQueryKeys.transaction(seedTransaction.id),
      seedTransaction
    )
  }

  const result = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <TransactionPresentationProvider>
          <TestRoutes repository={repository} />
        </TransactionPresentationProvider>
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
    expect(
      screen.queryByRole("button", { name: "Close transaction details" })
    ).not.toBeInTheDocument()
  })

  it("keeps a transaction-shaped skeleton visible during loading", () => {
    const repository = createRepository(
      () => new Promise<Transaction>(() => undefined)
    )
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
      const getTransactionById = vi.fn(async () => generatedTransaction)
      renderRoute({
        initialEntry: `/transactions/${id}`,
        repository: createRepository(getTransactionById),
        seedTransaction: generatedTransaction,
      })

      expect(
        await screen.findByRole("heading", { name: counterpartyName })
      ).toBeVisible()
      expect(getTransactionById).not.toHaveBeenCalled()
    }
  )

  it("opens from Dashboard in a route-backed Drawer and closes back to Dashboard", async () => {
    const user = userEvent.setup()
    renderRoute({ initialEntry: "/dashboard" })

    await user.click(screen.getByRole("link", { name: /Ahmed Al-Harbi/i }))

    expect(await screen.findByTestId("location")).toHaveTextContent(
      "/transactions/txn_1001"
    )
    expect(
      await screen.findByRole("button", { name: "Close transaction details" })
    ).toBeVisible()
    expect(
      document.querySelector('[data-slot="drawer-popup"]')
    ).toHaveAttribute("data-swipe-direction", "down")
    expect(
      document.querySelector('[data-slot="drawer-swipe-handle"]')
    ).toBeInTheDocument()

    await user.click(
      screen.getByRole("button", { name: "Close transaction details" })
    )

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent("/dashboard")
    )
  })

  it("keeps ordinary links to a transaction standalone", async () => {
    const user = userEvent.setup()
    renderRoute({ initialEntry: "/link-only" })

    await user.click(screen.getByRole("link", { name: "Open" }))

    expect(
      await screen.findByRole("link", { name: "Back to activity" })
    ).toBeVisible()
    expect(
      screen.queryByRole("button", { name: "Close transaction details" })
    ).not.toBeInTheDocument()
  })
})
