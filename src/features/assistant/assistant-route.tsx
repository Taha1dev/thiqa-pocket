import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"

import { buttonVariants } from "@/components/ui/button"
import {
  AssistantChat,
  AssistantChatSkeleton,
} from "@/features/assistant/assistant-chat"
import { assistantProvider } from "@/infrastructure/assistant/http-assistant-provider"
import { walletRepository } from "@/infrastructure/wallet/json-wallet-repository"
import {
  transactionsQueryOptions,
  walletQueryOptions,
} from "@/infrastructure/wallet/wallet-queries"
import { DataValidationError } from "@/shared/errors/data-validation-error"
import { RequestError } from "@/shared/errors/request-error"
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

export function Component() {
  const { t, i18n } = useTranslation("assistant")
  const walletQuery = useQuery(walletQueryOptions(walletRepository))
  const transactionsQuery = useQuery(transactionsQueryOptions(walletRepository))

  const pageShellProps = {
    title: t("page.title"),
    description: t("page.description"),
  }

  if (walletQuery.isPending || transactionsQuery.isPending) {
    return (
      <PageShell {...pageShellProps}>
        <span className="sr-only" role="status">
          {t("data.loading")}
        </span>
        <AssistantChatSkeleton />
      </PageShell>
    )
  }

  if (walletQuery.isError || transactionsQuery.isError) {
    const error = walletQuery.error ?? transactionsQuery.error

    return (
      <PageShell {...pageShellProps}>
        <PageState
          action={
            <button
              className={buttonVariants({ variant: "outline" })}
              type="button"
              onClick={() => {
                void walletQuery.refetch()
                void transactionsQuery.refetch()
              }}
            >
              {t("data.retry")}
            </button>
          }
          message={getDataErrorMessage(error, {
            invalid: t("data.invalid"),
            unavailable: t("data.unavailable"),
            generic: t("data.generic"),
          })}
          role="alert"
        />
      </PageShell>
    )
  }

  if (!walletQuery.data || !transactionsQuery.data) {
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
        transactions={transactionsQuery.data}
        wallet={walletQuery.data}
      />
    </PageShell>
  )
}
