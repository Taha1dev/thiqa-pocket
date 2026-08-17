import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"

import { buttonVariants } from "@/components/ui/button"
import { DashboardContent } from "@/features/dashboard/dashboard-content"
import { DashboardSkeleton } from "@/features/dashboard/components/dashboard-skeleton"
import { walletRepository } from "@/data/wallet-repository"
import { walletDataQueryOptions } from "@/data/wallet-queries"
import { DataValidationError, RequestError } from "@/shared/errors/errors"
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

export function DashboardPage() {
  const { t, i18n } = useTranslation(["wallet", "common"])
  const walletDataQuery = useQuery(walletDataQueryOptions(walletRepository))

  if (walletDataQuery.isPending) {
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

  if (walletDataQuery.isError) {
    const message = getWalletErrorMessage(walletDataQuery.error, {
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
                void walletDataQuery.refetch()
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

  if (!walletDataQuery.data) {
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
        name: getFirstName(walletDataQuery.data.wallet.name),
      })}
    >
      <DashboardContent
        locale={locale}
        transactions={walletDataQuery.data.transactions}
        wallet={walletDataQuery.data.wallet}
      />
    </PageShell>
  )
}
