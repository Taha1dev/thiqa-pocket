import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react"
import {
  ChatCircleDots,
  PaperPlaneTilt,
  Sparkle,
  WarningCircle,
} from "@phosphor-icons/react"
import { useMutation } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { AssistantProvider } from "@/domain/assistant/assistant-provider"
import type { Transaction } from "@/domain/transaction/transaction"
import type { WalletUser } from "@/domain/wallet/wallet"
import { cn } from "@/lib/utils"
import { BrandMark } from "@/shared/ui/brand-mark"

interface AssistantMessage {
  readonly id: string
  readonly role: "user" | "assistant"
  readonly content: string
}

interface AssistantChatProps {
  readonly provider: AssistantProvider
  readonly locale: string
  readonly wallet: WalletUser
  readonly transactions: readonly Transaction[]
}

interface AssistantMutationVariables {
  readonly question: string
  readonly requestId: number
  readonly controller: AbortController
}

const suggestionKeys = [
  "suggestions.transferMonth",
  "suggestions.largestExpense",
  "suggestions.topUpMonth",
  "suggestions.spendingSummary",
] as const

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError"
}

function shouldReduceMotion(): boolean {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
}

function AssistantAvatar() {
  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-petrol text-brand-petrol-foreground shadow-sm">
      <ChatCircleDots
        aria-hidden="true"
        className="size-[1.1rem]"
        weight="fill"
      />
    </span>
  )
}

function AssistantPending() {
  const { t } = useTranslation("assistant")

  return (
    <li>
      <div
        className="flex max-w-[min(100%,38rem)] items-start gap-3"
        role="status"
      >
        <AssistantAvatar />
        <div className="w-full rounded-2xl rounded-ss-md border border-border/70 bg-card px-4 py-3.5 elevated-surface">
          <span className="sr-only">{t("thinking.announcement")}</span>
          <p aria-hidden="true" className="text-sm font-medium">
            {t("thinking.label")}
          </p>
          <div aria-hidden="true" className="mt-3 space-y-2">
            <Skeleton className="h-2.5 w-[82%] rounded-full" />
            <Skeleton className="h-2.5 w-[58%] rounded-full" />
          </div>
        </div>
      </div>
    </li>
  )
}

function AssistantError({ onRetry }: { readonly onRetry: () => void }) {
  const { t } = useTranslation("assistant")

  return (
    <li>
      <div className="flex max-w-[min(100%,38rem)] items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-destructive/10 text-destructive">
          <WarningCircle aria-hidden="true" className="size-[1.1rem]" />
        </span>
        <div
          className="rounded-2xl rounded-ss-md border border-destructive/25 bg-destructive/5 px-4 py-3.5"
          role="alert"
        >
          <p className="text-sm font-semibold">{t("error.title")}</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {t("error.description")}
          </p>
          <Button
            className="mt-3"
            size="sm"
            type="button"
            variant="outline"
            onClick={onRetry}
          >
            {t("error.retry")}
          </Button>
        </div>
      </div>
    </li>
  )
}

function Message({ message }: { readonly message: AssistantMessage }) {
  const { t } = useTranslation("assistant")
  const isUser = message.role === "user"

  return (
    <li>
      <article
        aria-label={t(
          isUser ? "conversation.userMessage" : "conversation.assistantMessage"
        )}
        className={cn(
          "flex max-w-[min(100%,38rem)] items-start gap-3",
          isUser && "ms-auto flex-row-reverse"
        )}
      >
        {isUser ? (
          <BrandMark className="size-9 shrink-0 shadow-sm" />
        ) : (
          <AssistantAvatar />
        )}
        <p
          className={cn(
            "rounded-2xl px-4 py-3 text-start text-sm leading-6 whitespace-pre-wrap [unicode-bidi:plaintext]",
            isUser
              ? "rounded-se-md bg-primary text-primary-foreground"
              : "rounded-ss-md border border-border/70 bg-card elevated-surface"
          )}
          dir="auto"
        >
          {message.content}
        </p>
      </article>
    </li>
  )
}

function EmptyAssistantState({
  disabled,
  onSelect,
}: {
  readonly disabled: boolean
  readonly onSelect: (question: string) => void
}) {
  const { t } = useTranslation("assistant")

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-1 py-8 text-center sm:py-10">
      <div className="relative mb-5 grid size-14 place-items-center rounded-2xl bg-brand-petrol text-brand-petrol-foreground shadow-[0_16px_40px_-22px_var(--brand-petrol)]">
        <ChatCircleDots aria-hidden="true" className="size-6" weight="fill" />
        <span className="absolute -end-1 -top-1 grid size-5 place-items-center rounded-full bg-brand-gold text-brand-gold-foreground ring-4 ring-background">
          <Sparkle aria-hidden="true" className="size-3" weight="fill" />
        </span>
      </div>
      <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
        {t("intro.badge")}
      </span>
      <h2 className="mt-4 text-xl font-semibold tracking-[-0.025em] sm:text-2xl">
        {t("intro.title")}
      </h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
        {t("intro.description")}
      </p>
      <div className="mt-6 grid w-full gap-2 sm:grid-cols-2">
        {suggestionKeys.map((key) => {
          const question = t(key)

          return (
            <button
              className="min-h-14 pressable rounded-2xl border border-border/75 bg-card px-4 py-3 text-start text-sm leading-5 font-medium hover:border-primary/40 hover:bg-accent/55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50"
              disabled={disabled}
              key={key}
              type="button"
              onClick={() => onSelect(question)}
            >
              <span dir="auto">{question}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function AssistantChat({
  provider,
  locale,
  wallet,
  transactions,
}: AssistantChatProps) {
  const { t } = useTranslation("assistant")
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<readonly AssistantMessage[]>([])
  const [failedQuestion, setFailedQuestion] = useState<string | null>(null)
  const messageIdRef = useRef(0)
  const requestIdRef = useRef(0)
  const activeRequestIdRef = useRef<number | null>(null)
  const controllerRef = useRef<AbortController | null>(null)
  const bottomAnchorRef = useRef<HTMLDivElement>(null)

  const mutation = useMutation({
    mutationFn: async ({
      question,
      requestId,
      controller,
    }: AssistantMutationVariables) => {
      const response = await provider.ask(
        { question, locale, wallet, transactions },
        controller.signal
      )

      return { response, requestId }
    },
    onSuccess: ({ response, requestId }) => {
      if (activeRequestIdRef.current !== requestId) {
        return
      }

      messageIdRef.current += 1
      setMessages((current) => [
        ...current,
        {
          id: `assistant-message-${messageIdRef.current}`,
          role: "assistant",
          content: response.answer,
        },
      ])
    },
    onError: (error, variables) => {
      if (
        activeRequestIdRef.current === variables.requestId &&
        !isAbortError(error)
      ) {
        setFailedQuestion(variables.question)
      }
    },
    onSettled: (_data, _error, variables) => {
      if (activeRequestIdRef.current === variables.requestId) {
        activeRequestIdRef.current = null
        controllerRef.current = null
      }
    },
  })

  useEffect(() => {
    return () => {
      activeRequestIdRef.current = null
      controllerRef.current?.abort()
      controllerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (
      messages.length === 0 &&
      !mutation.isPending &&
      failedQuestion === null
    ) {
      return
    }

    bottomAnchorRef.current?.scrollIntoView({
      behavior: shouldReduceMotion() ? "auto" : "smooth",
      block: "nearest",
    })
  }, [failedQuestion, messages.length, mutation.isPending])

  const runRequest = (question: string) => {
    if (activeRequestIdRef.current !== null) {
      return
    }

    requestIdRef.current += 1
    const requestId = requestIdRef.current
    const controller = new AbortController()
    activeRequestIdRef.current = requestId
    controllerRef.current = controller
    setFailedQuestion(null)
    mutation.mutate({ question, requestId, controller })
  }

  const submitQuestion = (rawQuestion: string) => {
    const question = rawQuestion.trim()

    if (!question || activeRequestIdRef.current !== null) {
      return
    }

    messageIdRef.current += 1
    setMessages((current) => [
      ...current,
      {
        id: `user-message-${messageIdRef.current}`,
        role: "user",
        content: question,
      },
    ])
    setInput("")
    runRequest(question)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    submitQuestion(input)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      submitQuestion(input)
    }
  }

  const isPending = mutation.isPending
  const hasConversation = messages.length > 0

  return (
    <section className="flex h-[calc(100svh-16rem)] max-h-[42rem] min-h-[24rem] overflow-hidden rounded-3xl border border-border/70 bg-card/45 elevated-surface sm:min-h-[32rem] lg:h-[calc(100svh-14rem)]">
      <div className="flex min-w-0 flex-1 flex-col">
        <div
          aria-label={t("conversation.label")}
          className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4 sm:px-6 sm:py-6"
          role="log"
        >
          {hasConversation ? (
            <ol className="space-y-5">
              {messages.map((message) => (
                <Message key={message.id} message={message} />
              ))}
              {isPending ? <AssistantPending /> : null}
              {failedQuestion ? (
                <AssistantError onRetry={() => runRequest(failedQuestion)} />
              ) : null}
            </ol>
          ) : (
            <EmptyAssistantState
              disabled={isPending}
              onSelect={submitQuestion}
            />
          )}
          <div aria-hidden="true" ref={bottomAnchorRef} />
        </div>

        <form
          className="border-t border-border/70 bg-card p-3 sm:p-4"
          onSubmit={handleSubmit}
        >
          <label className="sr-only" htmlFor="assistant-question">
            {t("composer.label")}
          </label>
          <div className="flex items-end gap-2 rounded-2xl border border-input bg-field p-1.5 transition-[border-color,box-shadow,background-color] focus-within:border-ring focus-within:bg-card focus-within:ring-3 focus-within:ring-ring/20">
            <textarea
              aria-describedby="assistant-composer-hint"
              className="localized-placeholder-direction max-h-32 min-h-10 min-w-0 flex-1 resize-none bg-transparent px-2 py-2 text-base leading-6 outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
              dir="auto"
              disabled={isPending}
              id="assistant-question"
              maxLength={500}
              placeholder={t("composer.placeholder")}
              rows={1}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
            />
            <Button
              aria-label={t("composer.send")}
              className="mb-0.5"
              data-testid="assistant-send"
              disabled={isPending || input.trim().length === 0}
              size="icon"
              type="submit"
            >
              <PaperPlaneTilt aria-hidden="true" weight="fill" />
            </Button>
          </div>
          <p
            className="mt-2 px-1 text-xs leading-5 text-muted-foreground"
            id="assistant-composer-hint"
          >
            {t("composer.hint")}
          </p>
        </form>
      </div>
    </section>
  )
}

export function AssistantChatSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex h-[calc(100svh-16rem)] max-h-[42rem] min-h-[24rem] flex-col rounded-3xl border border-border/70 bg-card/45 p-4 sm:min-h-[32rem] sm:p-6 lg:h-[calc(100svh-14rem)]"
    >
      <div className="m-auto flex w-full max-w-xl flex-col items-center">
        <Skeleton className="size-14 rounded-2xl" />
        <Skeleton className="mt-5 h-5 w-28 rounded-full" />
        <Skeleton className="mt-4 h-7 w-56" />
        <Skeleton className="mt-3 h-4 w-full max-w-md" />
        <div className="mt-6 grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
          {[0, 1, 2, 3].map((item) => (
            <Skeleton className="h-14 rounded-2xl" key={item} />
          ))}
        </div>
      </div>
      <Skeleton className="mt-6 h-16 w-full rounded-2xl" />
    </div>
  )
}
