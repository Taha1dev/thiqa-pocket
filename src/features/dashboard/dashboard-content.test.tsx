import { render, screen, within } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { beforeEach, describe, expect, it } from "vitest"

import { createMoney } from "@/domain/money"
import type { Transaction } from "@/domain/transaction"
import type { WalletUser } from "@/domain/wallet"
import { DashboardContent } from "@/features/dashboard/dashboard-content"
import i18n from "@/i18n/config"

const wallet: WalletUser = {
  id: "usr_1001",
  name: "Sara Al-Otaibi",
  phone: "+966501234567",
  balance: createMoney(4285.5, "SAR"),
}

const transactions: readonly Transaction[] = [
  {
    id: "txn_completed",
    type: "credit",
    category: "top_up",
    amount: createMoney(1000, "SAR"),
    counterpartyName: "Bank Transfer",
    counterpartyAccount: null,
    status: "completed",
    timestamp: "2026-08-11T09:15:00+03:00",
    note: null,
  },
  {
    id: "txn_pending",
    type: "debit",
    category: "purchase",
    amount: createMoney(76.2, "SAR"),
    counterpartyName: "Panda Hypermarket",
    counterpartyAccount: null,
    status: "pending",
    timestamp: "2026-08-10T12:05:00+03:00",
    note: null,
  },
  {
    id: "txn_failed",
    type: "debit",
    category: "transfer",
    amount: createMoney(500, "SAR"),
    counterpartyName: "Fatima Al-Zahrani",
    counterpartyAccount: "SA4420000001234567891234",
    status: "failed",
    timestamp: "2026-08-09T20:11:00+03:00",
    note: null,
  },
]

describe("dashboard content", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en")
  })

  it("renders real activity rows with status text and deep links", () => {
    render(
      <MemoryRouter>
        <DashboardContent
          locale="en"
          transactions={transactions}
          wallet={wallet}
        />
      </MemoryRouter>
    )

    expect(screen.getByText("Sara Al-Otaibi")).toBeInTheDocument()
    expect(screen.getByText("Completed")).toBeInTheDocument()
    expect(screen.getByText("Pending")).toBeInTheDocument()
    expect(screen.getByText("Failed")).toBeInTheDocument()

    const pendingTransaction = screen.getByRole("link", {
      name: /Panda Hypermarket/i,
    })
    expect(pendingTransaction).toHaveAttribute(
      "href",
      "/transactions/txn_pending"
    )
    expect(within(pendingTransaction).getByText("Pending")).toBeInTheDocument()
  })

  it("renders a quiet empty state without transaction links", () => {
    render(
      <MemoryRouter>
        <DashboardContent locale="en" transactions={[]} wallet={wallet} />
      </MemoryRouter>
    )

    expect(
      screen.getByText("No transactions have been recorded yet.")
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("link", { name: /Bank Transfer/i })
    ).not.toBeInTheDocument()
  })
})
