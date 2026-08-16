import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { createMoneyFromMinor } from "@/domain/money/money"
import type { Transaction } from "@/domain/transaction/transaction"
import { TransactionDetailContent } from "@/features/transactions/transaction-detail-content"
import i18n from "@/i18n/config"

const sileoMocks = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn(),
}))

vi.mock("sileo", () => ({ sileo: sileoMocks }))

const baseTransaction: Transaction = {
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

describe("TransactionDetailContent", () => {
  const writeText = vi.fn().mockResolvedValue(undefined)

  beforeEach(async () => {
    vi.clearAllMocks()
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    })
    await i18n.changeLanguage("en")
  })

  it.each([
    ["completed", "Completed"],
    ["pending", "Pending"],
    ["failed", "Failed"],
  ] as const)("renders the %s business status", (status, label) => {
    render(
      <TransactionDetailContent
        locale="en"
        transaction={{ ...baseTransaction, status }}
      />
    )

    expect(screen.getByText(label)).toBeVisible()
    expect(
      screen.getByRole("heading", { name: "Ahmed Al-Harbi" })
    ).toBeVisible()
  })

  it("uses the transaction type for a signed credit amount", () => {
    render(
      <TransactionDetailContent
        locale="en"
        transaction={{
          ...baseTransaction,
          type: "credit",
          category: "top_up",
          counterpartyName: "Bank Transfer",
          counterpartyAccount: null,
          note: null,
        }}
      />
    )

    expect(screen.getByText(/\+SAR\s*250\.00/)).toBeVisible()
    expect(screen.getByText("Money in")).toBeVisible()
    expect(
      screen.queryByRole("button", { name: "Copy IBAN or account" })
    ).not.toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "Note" })).toBeNull()
  })

  it("copies the full transaction ID and IBAN with honest feedback", async () => {
    const user = userEvent.setup()
    const clipboardWrite = vi.spyOn(navigator.clipboard, "writeText")
    render(
      <TransactionDetailContent locale="en" transaction={baseTransaction} />
    )

    await user.click(
      screen.getByRole("button", { name: "Copy transaction ID" })
    )
    await user.click(
      screen.getByRole("button", { name: "Copy IBAN or account" })
    )

    expect(clipboardWrite).toHaveBeenNthCalledWith(1, "txn_1001")
    expect(clipboardWrite).toHaveBeenNthCalledWith(
      2,
      "SA0380000000608010167519"
    )
    expect(sileoMocks.success).toHaveBeenCalledTimes(2)
  })

  it("gives a failed transaction note appropriate prominence", () => {
    render(
      <TransactionDetailContent
        locale="en"
        transaction={{
          ...baseTransaction,
          status: "failed",
          note: "Insufficient balance at time of send",
        }}
      />
    )

    expect(
      screen.getByRole("heading", { name: "Why this transaction failed" })
    ).toBeVisible()
    expect(
      screen.getByText("Insufficient balance at time of send")
    ).toBeVisible()
  })
})
