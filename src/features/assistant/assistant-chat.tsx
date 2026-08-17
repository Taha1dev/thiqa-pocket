import { useTranslation } from "react-i18next"

import { Skeleton } from "@/components/ui/skeleton"
import type { AssistantProvider } from "@/data/assistant-client"
import type { Transaction } from "@/domain/transaction"
import type { WalletUser } from "@/domain/wallet"
import { ChatComposer } from "@/features/assistant/chat-composer"
import {
  AssistantError,
  AssistantPending,
  ChatMessage,
} from "@/features/assistant/chat-message"
import { PromptSuggestions } from "@/features/assistant/prompt-suggestions"
import { useAssistantChat } from "@/features/assistant/use-assistant-chat"

interface AssistantChatProps {
  readonly provider: AssistantProvider
  readonly locale: string
  readonly wallet: WalletUser
  readonly transactions: readonly Transaction[]
}

export function AssistantChat({
  provider,
  locale,
  wallet,
  transactions,
}: AssistantChatProps) {
  const { t } = useTranslation("assistant")
  const {
    bottomAnchorRef,
    failedQuestion,
    input,
    isPending,
    messages,
    retryQuestion,
    setInput,
    submitQuestion,
  } = useAssistantChat({ provider, locale, wallet, transactions })
  const hasConversation = messages.length > 0

  return (
    <section className="flex h-[calc(100svh-16rem)] max-h-168 min-h-96 overflow-hidden rounded-3xl border border-border/70 bg-card/45 elevated-surface sm:min-h-128 lg:h-[calc(100svh-14rem)]">
      <div className="flex min-w-0 flex-1 flex-col">
        <div
          aria-label={t("conversation.label")}
          className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4 sm:px-6 sm:py-6"
          role="log"
        >
          {hasConversation ? (
            <ol className="space-y-5">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isPending ? <AssistantPending /> : null}
              {failedQuestion ? (
                <AssistantError onRetry={() => retryQuestion(failedQuestion)} />
              ) : null}
            </ol>
          ) : (
            <PromptSuggestions disabled={isPending} onSelect={submitQuestion} />
          )}
          <div aria-hidden="true" ref={bottomAnchorRef} />
        </div>

        <ChatComposer
          disabled={isPending}
          input={input}
          onInputChange={setInput}
          onSubmit={submitQuestion}
        />
      </div>
    </section>
  )
}

export function AssistantChatSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex h-[calc(100svh-16rem)] max-h-168 min-h-96 flex-col rounded-3xl border border-border/70 bg-card/45 p-4 sm:min-h-128 sm:p-6 lg:h-[calc(100svh-14rem)]"
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
