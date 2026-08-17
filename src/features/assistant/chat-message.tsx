import { ChatCircleDots, WarningCircle } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { AssistantMessage } from "@/features/assistant/use-assistant-chat"
import { cn } from "@/lib/utils"
import { BrandMark } from "@/shared/ui/brand-mark"

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

export function AssistantPending() {
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

export function AssistantError({ onRetry }: { readonly onRetry: () => void }) {
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

export function ChatMessage({
  message,
}: {
  readonly message: AssistantMessage
}) {
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
