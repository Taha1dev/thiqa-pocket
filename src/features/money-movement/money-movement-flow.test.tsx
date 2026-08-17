import type { ReactElement, ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { createMoney, createMoneyFromMinor } from "@/domain/money"
import type { TopUpReceipt, TransferReceipt } from "@/domain/money-movement"
import type { MoneyMovementRepository } from "@/data/money-movement-repository"
import type { WalletData, WalletUser } from "@/domain/wallet"
import { TopUpFlow } from "@/features/top-up/top-up-flow"
import { TransferFlow } from "@/features/transfer/transfer-flow"
import i18n from "@/i18n/config"
import { MockMoneyMovementRepository } from "@/data/money-movement-repository"
import { walletQueryKey } from "@/data/wallet-queries"
import { MoneyMovementError } from "@/shared/errors/errors"

interface CapturedToastOptions {
  readonly title?: string
  readonly description?: ReactNode
  readonly button?: {
    readonly title: string
    readonly onClick: () => void
  }
}

interface CapturedPromiseOptions<T> {
  readonly loading: CapturedToastOptions
  readonly success: CapturedToastOptions | ((data: T) => CapturedToastOptions)
  readonly error:
  CapturedToastOptions | ((error: unknown) => CapturedToastOptions)
}

const sileoMocks = vi.hoisted(() => ({
  promise: vi.fn((promise: Promise<unknown>, options?: unknown) => {
    void options
    return promise
  }),
}))

vi.mock("sileo", () => ({
  sileo: sileoMocks,
}))

const wallet: WalletUser = {
  id: "usr_test",
  name: "Sara Al-Otaibi",
  phone: "+966500000000",
  balance: createMoney(4285.5, "SAR"),
}

function renderFlow(element: ReactElement): QueryClient {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  })
  queryClient.setQueryData<WalletData>(walletQueryKey, {
    wallet,
    transactions: [],
  })

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{element}</MemoryRouter>
    </QueryClientProvider>
  )

  return queryClient
}

function getWalletData(queryClient: QueryClient): WalletData | undefined {
  return queryClient.getQueryData<WalletData>(walletQueryKey)
}

function createDeferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((nextResolve, nextReject) => {
    resolve = nextResolve
    reject = nextReject
  })

  return { promise, reject, resolve }
}

async function openTransferReview(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Recipient name"), "Ahmed Al-Harbi")
  await user.type(
    screen.getByLabelText("Saudi IBAN"),
    "sa03 8000 0000 6080 1016 7519"
  )
  await user.type(screen.getByLabelText("Amount"), "250")
  await user.type(screen.getByLabelText("Note (optional)"), "Rent share")
  await user.click(screen.getByRole("button", { name: "Review transfer" }))
}

async function openTopUpReview(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /100\.00/ }))
  await user.click(screen.getByRole("button", { name: "Review top up" }))
}

function getPromiseOptions<T>(): CapturedPromiseOptions<T> {
  const options = sileoMocks.promise.mock.calls.at(-1)?.[1]
  if (!options) {
    throw new Error("Expected sileo.promise options to be captured.")
  }

  return options as CapturedPromiseOptions<T>
}

function getSuccessOptions<T>(
  options: CapturedPromiseOptions<T>,
  data: T
): CapturedToastOptions {
  return typeof options.success === "function"
    ? options.success(data)
    : options.success
}

function getErrorOptions<T>(
  options: CapturedPromiseOptions<T>,
  error: unknown
): CapturedToastOptions {
  return typeof options.error === "function"
    ? options.error(error)
    : options.error
}

describe("transfer flow", () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await i18n.changeLanguage("en")
  })

  it("uses localized text direction while keeping financial identifiers LTR", async () => {
    await i18n.changeLanguage("ar")
    const repository = new MockMoneyMovementRepository({ delayMs: 0 })
    renderFlow(<TransferFlow repository={repository} wallet={wallet} />)

    expect(document.getElementById("transfer-recipient")).toHaveAttribute(
      "dir",
      "auto"
    )
    expect(document.getElementById("transfer-note")).toHaveAttribute(
      "dir",
      "auto"
    )
    expect(document.getElementById("transfer-recipient")).toHaveClass(
      "localized-placeholder-direction"
    )
    expect(document.getElementById("transfer-note")).toHaveClass(
      "localized-placeholder-direction"
    )
    expect(document.getElementById("transfer-iban")).toHaveAttribute(
      "dir",
      "ltr"
    )
    expect(document.getElementById("transfer-amount")).toHaveAttribute(
      "dir",
      "ltr"
    )
    expect(
      document.getElementById("transfer-amount")?.parentElement
    ).toHaveAttribute("dir", "ltr")
  })

  it("shows required validation and focuses the first invalid field", async () => {
    const user = userEvent.setup()
    const repository = new MockMoneyMovementRepository({ delayMs: 0 })
    renderFlow(<TransferFlow repository={repository} wallet={wallet} />)

    await user.click(screen.getByRole("button", { name: "Review transfer" }))

    expect(await screen.findByText("Enter the recipient name.")).toBeVisible()
    expect(screen.getByText("Enter the recipient's Saudi IBAN.")).toBeVisible()
    expect(screen.getByText("Enter an amount.")).toBeVisible()
    expect(screen.getByLabelText("Recipient name")).toHaveFocus()
  })

  it("normalizes review data, completes the transfer, and renders its receipt", async () => {
    const user = userEvent.setup()
    const repository = new MockMoneyMovementRepository({
      delayMs: 0,
      createId: () => "txn_flow_transfer",
      now: () => new Date("2026-08-16T10:00:00.000Z"),
    })
    const queryClient = renderFlow(
      <TransferFlow repository={repository} wallet={wallet} />
    )

    await user.type(screen.getByLabelText("Recipient name"), "Ahmed Al-Harbi")
    await user.type(
      screen.getByLabelText("Saudi IBAN"),
      "sa03 8000 0000 6080 1016 7519"
    )
    await user.type(screen.getByLabelText("Amount"), "250")
    await user.type(screen.getByLabelText("Note (optional)"), "Rent share")
    await user.click(screen.getByRole("button", { name: "Review transfer" }))

    expect(
      await screen.findByRole("heading", { name: "Review transfer" })
    ).toBeVisible()
    expect(screen.getByText("SA03 8000 0000 6080 1016 7519")).toBeVisible()
    expect(screen.getByText("Ahmed Al-Harbi")).toBeVisible()

    await user.click(screen.getByRole("button", { name: "Confirm transfer" }))

    expect(
      await screen.findByRole("heading", { name: "Transfer complete" })
    ).toBeVisible()
    expect(screen.getByText("txn_flow_transfer")).toBeVisible()
    expect(sileoMocks.promise).toHaveBeenCalledOnce()
    const toastOptions = getPromiseOptions<TransferReceipt>()
    expect(toastOptions.loading.title).toBe("Sending transfer")
    const successToast = getSuccessOptions(toastOptions, {
      kind: "transfer",
      transactionId: "txn_flow_transfer",
      status: "completed",
      amount: createMoney(250, "SAR"),
      balanceAfter: createMoney(4035.5, "SAR"),
      recipientName: "Ahmed Al-Harbi",
      iban: "SA0380000000608010167519",
      note: "Rent share",
      timestamp: "2026-08-16T10:00:00.000Z",
    })
    expect(successToast.title).toBe("Transfer complete")
    expect(successToast.button?.title).toBe("View receipt")
    expect(getWalletData(queryClient)?.wallet.balance.amountMinor).toBe(403_550)
    expect(getWalletData(queryClient)?.transactions[0]).toMatchObject({
      id: "txn_flow_transfer",
      type: "debit",
    })
  })

  it("keeps the cache unchanged while pending and blocks duplicate confirmation", async () => {
    const user = userEvent.setup()
    const deferred = createDeferred<TransferReceipt>()
    const receipt: TransferReceipt = {
      kind: "transfer",
      transactionId: "txn_deferred_transfer",
      status: "completed",
      amount: createMoney(250, "SAR"),
      balanceAfter: createMoneyFromMinor(403_550, "SAR"),
      recipientName: "Ahmed Al-Harbi",
      iban: "SA0380000000608010167519",
      note: "Rent share",
      timestamp: "2026-08-16T10:00:00.000Z",
    }
    const transfer = vi.fn(() => deferred.promise)
    const repository: MoneyMovementRepository = {
      transfer,
      topUp: () => Promise.reject(new Error("Unexpected top-up call")),
    }
    const queryClient = renderFlow(
      <TransferFlow repository={repository} wallet={wallet} />
    )

    await openTransferReview(user)
    const confirmButton = screen.getByRole("button", {
      name: "Confirm transfer",
    })
    fireEvent.click(confirmButton)
    fireEvent.click(confirmButton)

    expect(
      await screen.findByRole("button", { name: "Confirming transfer" })
    ).toBeDisabled()
    expect(confirmButton).toHaveAttribute("aria-disabled", "true")
    expect(transfer).toHaveBeenCalledOnce()
    expect(sileoMocks.promise).toHaveBeenCalledOnce()
    expect(getWalletData(queryClient)?.wallet.balance.amountMinor).toBe(428_550)
    expect(getWalletData(queryClient)?.transactions).toEqual([])

    await act(async () => {
      deferred.resolve(receipt)
      await deferred.promise
    })

    expect(
      await screen.findByRole("heading", { name: "Transfer complete" })
    ).toBeVisible()
    expect(getWalletData(queryClient)?.wallet.balance.amountMinor).toBe(403_550)
    expect(getWalletData(queryClient)?.transactions).toHaveLength(1)

    const successToast = getSuccessOptions(
      getPromiseOptions<TransferReceipt>(),
      receipt
    )
    const toast = render(<>{successToast.description}</>)
    expect(within(toast.container).getByText("Ahmed Al-Harbi")).toBeVisible()
    expect(
      within(toast.container).getByText("SA03 •••• •••• 7519")
    ).toHaveAttribute("dir", "ltr")
    act(() => successToast.button?.onClick())
    expect(
      screen.getByRole("heading", { name: "Transfer complete" })
    ).toBeVisible()
  })

  it("keeps review data and both caches unchanged after a failed transfer", async () => {
    const user = userEvent.setup()
    const deferred = createDeferred<TransferReceipt>()
    const transfer = vi.fn(() => deferred.promise)
    const repository: MoneyMovementRepository = {
      transfer,
      topUp: () => Promise.reject(new Error("Unexpected top-up call")),
    }
    const queryClient = renderFlow(
      <TransferFlow repository={repository} wallet={wallet} />
    )

    await openTransferReview(user)
    fireEvent.click(screen.getByRole("button", { name: "Confirm transfer" }))
    const requestError = new MoneyMovementError("request_failed")

    await act(async () => {
      deferred.reject(requestError)
      await deferred.promise.catch(() => undefined)
    })

    expect(
      await screen.findByText(
        "The simulated transfer could not be completed. Try again."
      )
    ).toHaveAttribute("role", "alert")
    expect(
      screen.getByRole("button", { name: "Confirm transfer" })
    ).toBeEnabled()
    expect(screen.getByText("Ahmed Al-Harbi")).toBeVisible()
    expect(getWalletData(queryClient)?.wallet.balance.amountMinor).toBe(428_550)
    expect(getWalletData(queryClient)?.transactions).toEqual([])

    const errorToast = getErrorOptions(
      getPromiseOptions<TransferReceipt>(),
      requestError
    )
    expect(errorToast.title).toBe("Transfer failed")
    expect(errorToast.description).toBe(
      "The simulated transfer could not be completed. Try again."
    )
  })
})

describe("top-up flow", () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await i18n.changeLanguage("en")
  })

  it("keeps the amount and its currency suffix in one LTR control", async () => {
    await i18n.changeLanguage("ar")
    const repository = new MockMoneyMovementRepository({ delayMs: 0 })
    renderFlow(<TopUpFlow repository={repository} wallet={wallet} />)

    const amountInput = document.getElementById("top-up-amount")
    expect(amountInput).toHaveAttribute("dir", "ltr")
    expect(amountInput?.parentElement).toHaveAttribute("dir", "ltr")
  })

  it("selects a preset, reviews it, completes the top up, and renders its receipt", async () => {
    const user = userEvent.setup()
    const repository = new MockMoneyMovementRepository({
      delayMs: 0,
      createId: () => "txn_flow_top_up",
      now: () => new Date("2026-08-16T10:00:00.000Z"),
    })
    const queryClient = renderFlow(
      <TopUpFlow repository={repository} wallet={wallet} />
    )

    const preset = screen.getByRole("button", { name: /100\.00/ })
    await user.click(preset)
    expect(preset).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByLabelText("Custom amount")).toHaveValue("100")

    await user.click(screen.getByRole("button", { name: "Review top up" }))
    expect(
      await screen.findByRole("heading", { name: "Review top up" })
    ).toBeVisible()
    expect(screen.getByText("Bank transfer")).toBeVisible()

    await user.click(screen.getByRole("button", { name: "Confirm top up" }))

    expect(
      await screen.findByRole("heading", { name: "Top up complete" })
    ).toBeVisible()
    expect(screen.getByText("txn_flow_top_up")).toBeVisible()
    expect(sileoMocks.promise).toHaveBeenCalledOnce()
    const toastOptions = getPromiseOptions<TopUpReceipt>()
    expect(toastOptions.loading.title).toBe("Processing top up")
    const successToast = getSuccessOptions(toastOptions, {
      kind: "top_up",
      transactionId: "txn_flow_top_up",
      status: "completed",
      amount: createMoney(100, "SAR"),
      balanceAfter: createMoney(4385.5, "SAR"),
      source: "bank_transfer",
      timestamp: "2026-08-16T10:00:00.000Z",
    })
    expect(successToast.title).toBe("Top up complete")
    expect(successToast.button?.title).toBe("View receipt")
    await waitFor(() =>
      expect(getWalletData(queryClient)?.wallet.balance.amountMinor).toBe(
        438_550
      )
    )
    expect(getWalletData(queryClient)?.transactions[0]).toMatchObject({
      id: "txn_flow_top_up",
      type: "credit",
      category: "top_up",
    })
  })

  it("commits a top up only after its pending request resolves", async () => {
    const user = userEvent.setup()
    const deferred = createDeferred<TopUpReceipt>()
    const receipt: TopUpReceipt = {
      kind: "top_up",
      transactionId: "txn_deferred_top_up",
      status: "completed",
      amount: createMoney(100, "SAR"),
      balanceAfter: createMoneyFromMinor(438_550, "SAR"),
      source: "bank_transfer",
      timestamp: "2026-08-16T10:00:00.000Z",
    }
    const topUp = vi.fn(() => deferred.promise)
    const repository: MoneyMovementRepository = {
      transfer: () => Promise.reject(new Error("Unexpected transfer call")),
      topUp,
    }
    const queryClient = renderFlow(
      <TopUpFlow repository={repository} wallet={wallet} />
    )

    await openTopUpReview(user)
    const confirmButton = screen.getByRole("button", {
      name: "Confirm top up",
    })
    fireEvent.click(confirmButton)
    fireEvent.click(confirmButton)

    expect(
      await screen.findByRole("button", { name: "Confirming top up" })
    ).toBeDisabled()
    expect(confirmButton).toHaveAttribute("aria-disabled", "true")
    expect(topUp).toHaveBeenCalledOnce()
    expect(sileoMocks.promise).toHaveBeenCalledOnce()
    expect(getWalletData(queryClient)?.wallet.balance.amountMinor).toBe(428_550)
    expect(getWalletData(queryClient)?.transactions).toEqual([])

    await act(async () => {
      deferred.resolve(receipt)
      await deferred.promise
    })

    expect(
      await screen.findByRole("heading", { name: "Top up complete" })
    ).toBeVisible()
    expect(getWalletData(queryClient)?.wallet.balance.amountMinor).toBe(438_550)
    expect(getWalletData(queryClient)?.transactions).toHaveLength(1)

    const successToast = getSuccessOptions(
      getPromiseOptions<TopUpReceipt>(),
      receipt
    )
    const toast = render(<>{successToast.description}</>)
    expect(within(toast.container).getByText("Bank transfer")).toBeVisible()
    expect(within(toast.container).getByText(/4,385\.50/)).toBeVisible()
    act(() => successToast.button?.onClick())
    expect(
      screen.getByRole("heading", { name: "Top up complete" })
    ).toBeVisible()
  })

  it("keeps the chosen amount when returning from review", async () => {
    const user = userEvent.setup()
    const repository = new MockMoneyMovementRepository({ delayMs: 0 })
    renderFlow(<TopUpFlow repository={repository} wallet={wallet} />)

    await user.type(screen.getByLabelText("Custom amount"), "500")
    await user.click(screen.getByRole("button", { name: "Review top up" }))
    await user.click(screen.getByRole("button", { name: "Edit amount" }))

    expect(screen.getByLabelText("Custom amount")).toHaveValue("500")
  })
})
