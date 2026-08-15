import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"

import { buttonVariants } from "@/components/ui/button"
import {
  DashboardContent,
  DashboardSkeleton,
} from "@/features/dashboard/dashboard-content"
import { walletRepository } from "@/infrastructure/wallet/json-wallet-repository"
import {
  transactionsQueryOptions,
  walletQueryOptions,
} from "@/infrastructure/wallet/wallet-queries"
import { DataValidationError } from "@/shared/errors/data-validation-error"
import { RequestError } from "@/shared/errors/request-error"
import { PageShell } from "@/shared/ui/page-shell"
import { PageState } from "@/shared/ui/page-state"

function getWalletErrorMessage(
  error: unknown,
  messages: Record<"invalidData" | "unavailable" | "generic", string>
): string {
  if (error instanceof DataValidationError) {
    return messages.invalidData
  }

  if (error instanceof RequestError) {
    return messages.unavailable
  }

  return messages.generic
}

function getFirstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name
}

export function Component() {
  const { t, i18n } = useTranslation(["wallet", "common"])
  const walletQuery = useQuery(walletQueryOptions(walletRepository))
  const transactionsQuery = useQuery(transactionsQueryOptions(walletRepository))

  if (walletQuery.isPending || transactionsQuery.isPending) {
    return (
      <PageShell
        description={t("dashboard.description")}
        size="wide"
        title={t("dashboard.title")}
      >
        <span className="sr-only" role="status">
          {t("common:states.loading")}
        </span>
        <DashboardSkeleton />
      </PageShell>
    )
  }

  if (walletQuery.isError || transactionsQuery.isError) {
    const error = walletQuery.error ?? transactionsQuery.error
    const message = getWalletErrorMessage(error, {
      invalidData: t("errors.invalidData"),
      unavailable: t("errors.unavailable"),
      generic: t("errors.generic"),
    })

    return (
      <PageShell
        description={t("dashboard.description")}
        size="wide"
        title={t("dashboard.title")}
      >
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
              {t("common:actions.retry")}
            </button>
          }
          message={message}
          role="alert"
        />
      </PageShell>
    )
  }

  if (!walletQuery.data || !transactionsQuery.data) {
    return (
      <PageShell
        description={t("dashboard.description")}
        size="wide"
        title={t("dashboard.title")}
      >
        <PageState message={t("errors.generic")} role="alert" />
      </PageShell>
    )
  }

  const locale = i18n.resolvedLanguage ?? "en"

  return (
    <PageShell
      description={t("dashboard.context")}
      size="wide"
      title={t("dashboard.greeting", {
        name: getFirstName(walletQuery.data.name),
      })}
    >
      <DashboardContent
        locale={locale}
        transactions={transactionsQuery.data}
        wallet={walletQuery.data}
      />
    </PageShell>
  )
}
