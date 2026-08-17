import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"

import { buttonVariants } from "@/components/ui/button"
import {
  AssistantChat,
  AssistantChatSkeleton,
} from "@/features/assistant/assistant-chat"
import { assistantProvider } from "@/data/assistant-client"
import { walletRepository } from "@/data/wallet-repository"
import { walletDataQueryOptions } from "@/data/wallet-queries"
import { DataValidationError, RequestError } from "@/shared/errors/errors"
import { PageShell } from "@/shared/ui/page-shell"
import { PageState } from "@/shared/ui/page-state"

function getDataErrorMessage(
  error: unknown,
  messages: Record<"invalid" | "unavailable" | "generic", string>
): string {
  if (error instanceof DataValidationError) {
    return messages.invalid
  }

  if (error instanceof RequestError) {
    return messages.unavailable
  }

  return messages.generic
}

export function AssistantPage() {
  const { t, i18n } = useTranslation("assistant")
  const walletDataQuery = useQuery(walletDataQueryOptions(walletRepository))

  const pageShellProps = {
    title: t("page.title"),
    description: t("page.description"),
  }

  if (walletDataQuery.isPending) {
    return (
      <PageShell {...pageShellProps}>
        <span className="sr-only" role="status">
          {t("data.loading")}
        </span>
        <AssistantChatSkeleton />
      </PageShell>
    )
  }

  if (walletDataQuery.isError) {
    return (
      <PageShell {...pageShellProps}>
        <PageState
          action={
            <button
              className={buttonVariants({ variant: "outline" })}
              type="button"
              onClick={() => {
                void walletDataQuery.refetch()
              }}
            >
              {t("data.retry")}
            </button>
          }
          message={getDataErrorMessage(walletDataQuery.error, {
            invalid: t("data.invalid"),
            unavailable: t("data.unavailable"),
            generic: t("data.generic"),
          })}
          role="alert"
        />
      </PageShell>
    )
  }

  if (!walletDataQuery.data) {
    return (
      <PageShell {...pageShellProps}>
        <PageState message={t("data.generic")} role="alert" />
      </PageShell>
    )
  }

  return (
    <PageShell {...pageShellProps}>
      <AssistantChat
        locale={i18n.resolvedLanguage ?? "en"}
        provider={assistantProvider}
        transactions={walletDataQuery.data.transactions}
        wallet={walletDataQuery.data.wallet}
      />
    </PageShell>
  )
}
