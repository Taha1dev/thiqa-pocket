import type { ReactElement } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { AssistantProvider } from "@/domain/assistant/assistant-provider"
import { createMoney } from "@/domain/money/money"
import type { Transaction } from "@/domain/transaction/transaction"
import type { WalletUser } from "@/domain/wallet/wallet"
import { AssistantChat } from "@/features/assistant/assistant-chat"
import i18n from "@/i18n/config"
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
    counterpartyAccount: "SA0380000000608010167519",
    status: "completed",
    timestamp: "2026-08-12T14:32:00+03:00",
    note: "Rent share",
  },
]

function createDeferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((nextResolve, nextReject) => {
    resolve = nextResolve
    reject = nextReject
  })

  return { promise, reject, resolve }
}

function renderChat(
  provider: AssistantProvider,
  locale = "en"
): ReturnType<typeof render> {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  })

  const element: ReactElement = (
    <QueryClientProvider client={queryClient}>
      <AssistantChat
        locale={locale}
        provider={provider}
        transactions={transactions}
        wallet={wallet}
      />
    </QueryClientProvider>
  )

  return render(element)
}

beforeEach(async () => {
  await i18n.changeLanguage("en")
  Object.defineProperty(Element.prototype, "scrollIntoView", {
    configurable: true,
    value: vi.fn(),
  })
})

describe("AssistantChat", () => {
  it("renders a useful introduction and localized suggested questions", () => {
    const provider: AssistantProvider = {
      ask: vi.fn<AssistantProvider["ask"]>(),
    }

    renderChat(provider)

    expect(screen.getByText("Your wallet, explained.")).toBeInTheDocument()
    expect(
      screen.getByRole("button", {
        name: "How much did I spend on transfers this month?",
      })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", {
        name: "What was my largest completed expense?",
      })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", {
        name: "How much did I top up this month?",
      })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Summarize my recent spending." })
    ).toBeInTheDocument()
  })

  it("submits a typed question with the current locale and query data", async () => {
    const user = userEvent.setup()
    const ask = vi.fn<AssistantProvider["ask"]>().mockResolvedValue({
      answer: "Your completed transfer spend is SAR 250.",
    })
    renderChat({ ask })

    const textarea = screen.getByLabelText("Ask about your wallet")
    await user.type(textarea, "How much did I spend?{enter}")

    expect(screen.getByText("How much did I spend?")).toBeInTheDocument()
    await waitFor(() => {
      expect(ask).toHaveBeenCalledWith(
        {
          question: "How much did I spend?",
          locale: "en",
          wallet,
          transactions,
        },
        expect.any(AbortSignal)
      )
    })
    expect(
      await screen.findByText("Your completed transfer spend is SAR 250.")
    ).toBeInTheDocument()
    expect(screen.getByText("How much did I spend?")).toBeInTheDocument()
    expect(textarea).toHaveValue("")
  })

  it("submits a suggested question", async () => {
    const user = userEvent.setup()
    const deferred = createDeferred<{ answer: string }>()
    const ask = vi.fn<AssistantProvider["ask"]>(() => deferred.promise)
    renderChat({ ask })

    await user.click(
      screen.getByRole("button", {
        name: "How much did I top up this month?",
      })
    )

    expect(screen.getByText("How much did I top up this month?")).toBeVisible()
    await waitFor(() =>
      expect(ask).toHaveBeenCalledWith(
        expect.objectContaining({
          question: "How much did I top up this month?",
        }),
        expect.any(AbortSignal)
      )
    )

    await act(async () => {
      deferred.resolve({ answer: "SAR 3,000.00" })
      await deferred.promise
    })
  })

  it("shows assistant-shaped pending feedback and blocks duplicate submits", async () => {
    const user = userEvent.setup()
    const deferred = createDeferred<{ answer: string }>()
    const ask = vi.fn<AssistantProvider["ask"]>(() => deferred.promise)
    renderChat({ ask })

    await user.type(
      screen.getByLabelText("Ask about your wallet"),
      "Summarize my spending."
    )
    const sendButton = screen.getByRole("button", { name: "Send" })
    await user.click(sendButton)

    expect(screen.getByRole("status")).toHaveTextContent(
      "Thiqa AI is thinking."
    )
    expect(sendButton).toBeDisabled()
    await user.click(sendButton)
    expect(ask).toHaveBeenCalledTimes(1)

    await act(async () => {
      deferred.resolve({ answer: "Your spending is steady." })
      await deferred.promise
    })
  })

  it("keeps a failed question visible and retries that same question", async () => {
    const user = userEvent.setup()
    const ask = vi
      .fn<AssistantProvider["ask"]>()
      .mockRejectedValueOnce(new RequestError("Unavailable"))
      .mockResolvedValueOnce({ answer: "Your largest expense was SAR 320.00." })
    renderChat({ ask })

    await user.click(
      screen.getByRole("button", {
        name: "What was my largest completed expense?",
      })
    )

    expect(
      await screen.findByText("I couldn't answer that right now.")
    ).toBeInTheDocument()
    expect(
      screen.getByText("What was my largest completed expense?")
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Try again" }))

    expect(
      await screen.findByText("Your largest expense was SAR 320.00.")
    ).toBeInTheDocument()
    expect(ask).toHaveBeenCalledTimes(2)
    expect(ask.mock.calls[1]?.[0].question).toBe(
      "What was my largest completed expense?"
    )
  })

  it("uses the Arabic root direction and direction-aware input", async () => {
    await i18n.changeLanguage("ar")
    const provider: AssistantProvider = {
      ask: vi.fn<AssistantProvider["ask"]>(),
    }

    renderChat(provider, "ar")

    expect(document.documentElement).toHaveAttribute("dir", "rtl")
    expect(screen.getByLabelText("اسأل عن محفظتك")).toHaveAttribute(
      "dir",
      "auto"
    )
    expect(
      screen.getByRole("button", {
        name: "كم أنفقت على التحويلات هذا الشهر؟",
      })
    ).toBeInTheDocument()
  })

  it("aborts an in-flight request when the chat unmounts", async () => {
    const user = userEvent.setup()
    let requestSignal: AbortSignal | undefined
    const ask = vi.fn<AssistantProvider["ask"]>((_request, signal) => {
      requestSignal = signal
      return new Promise(() => undefined)
    })
    const view = renderChat({ ask })

    await user.type(
      screen.getByLabelText("Ask about your wallet"),
      "Summarize my spending.{enter}"
    )
    await waitFor(() => expect(requestSignal).toBeDefined())

    view.unmount()

    expect(requestSignal?.aborted).toBe(true)
  })
})
