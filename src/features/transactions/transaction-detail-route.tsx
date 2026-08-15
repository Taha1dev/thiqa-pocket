import { useQuery } from "@tanstack/react-query"
import { Link, useParams } from "react-router"
import { useTranslation } from "react-i18next"

import { routePaths } from "@/app/router/paths"
import { buttonVariants } from "@/components/ui/button"
import type { TransactionStatus } from "@/domain/transaction/transaction"
import { walletRepository } from "@/infrastructure/wallet/json-wallet-repository"
import { transactionQueryOptions } from "@/infrastructure/wallet/wallet-queries"
import { DataValidationError } from "@/shared/errors/data-validation-error"
import { EntityNotFoundError } from "@/shared/errors/entity-not-found-error"
import { RequestError } from "@/shared/errors/request-error"
import { formatDate } from "@/shared/formatting/format-date"
import { formatMoney } from "@/shared/formatting/format-money"
import { cn } from "@/lib/utils"
import { PageShell } from "@/shared/ui/page-shell"
import { PageState } from "@/shared/ui/page-state"

const statusClassNames: Record<TransactionStatus, string> = {
  completed: "bg-status-completed text-status-completed-foreground",
  pending: "bg-status-pending text-status-pending-foreground",
  failed: "bg-status-failed text-status-failed-foreground",
}

export function Component() {
  const { transactionId = "" } = useParams()
  const { t, i18n } = useTranslation(["transactions", "common"])
  const transactionQuery = useQuery(
    transactionQueryOptions(walletRepository, transactionId)
  )

  if (transactionQuery.isPending) {
    return (
      <PageShell
        title={t("detail.title")}
        description={t("common:states.loading")}
      >
        <PageState message={t("common:states.loading")} role="status" />
      </PageShell>
    )
  }

  if (transactionQuery.error instanceof EntityNotFoundError) {
    return (
      <PageShell
        title={t("detail.notFoundTitle")}
        description={t("detail.notFoundDescription")}
      >
        <Link
          className={buttonVariants({ variant: "outline" })}
          to={routePaths.dashboard}
        >
          {t("common:actions.backToDashboard")}
        </Link>
      </PageShell>
    )
  }

  if (transactionQuery.error) {
    const message =
      transactionQuery.error instanceof DataValidationError
        ? t("errors.invalidData")
        : transactionQuery.error instanceof RequestError
          ? t("errors.unavailable")
          : t("errors.generic")

    return (
      <PageShell title={t("detail.title")} description={message}>
        <PageState
          message={message}
          role="alert"
          action={
            <button
              className={buttonVariants({ variant: "outline" })}
              type="button"
              onClick={() => void transactionQuery.refetch()}
            >
              {t("common:actions.retry")}
            </button>
          }
        />
      </PageShell>
    )
  }

  const transaction = transactionQuery.data
  const locale = i18n.resolvedLanguage ?? "en"

  return (
    <PageShell
      title={t("detail.title")}
      description={t(`category.${transaction.category}`)}
    >
      <dl className="grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2">
        <div className="flex flex-col gap-1 bg-card p-5">
          <dt className="text-sm text-muted-foreground">
            {t("detail.amount")}
          </dt>
          <dd>
            <bdi className="financial-value text-xl font-semibold" dir="ltr">
              {formatMoney(transaction.amount, locale)}
            </bdi>
          </dd>
        </div>
        <div className="flex flex-col gap-1 bg-card p-5">
          <dt className="text-sm text-muted-foreground">
            {t("detail.status")}
          </dt>
          <dd>
            <span
              className={cn(
                "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                statusClassNames[transaction.status]
              )}
            >
              {t(`status.${transaction.status}`)}
            </span>
          </dd>
        </div>
        <div className="flex flex-col gap-1 bg-card p-5">
          <dt className="text-sm text-muted-foreground">
            {t("detail.counterparty")}
          </dt>
          <dd>{transaction.counterpartyName}</dd>
        </div>
        <div className="flex flex-col gap-1 bg-card p-5">
          <dt className="text-sm text-muted-foreground">{t("detail.date")}</dt>
          <dd>{formatDate(transaction.timestamp, locale)}</dd>
        </div>
        <div className="flex flex-col gap-1 bg-card p-5 sm:col-span-2">
          <dt className="text-sm text-muted-foreground">
            {t("detail.reference")}
          </dt>
          <dd>
            <bdi className="financial-value text-sm" dir="ltr">
              {transaction.id}
            </bdi>
          </dd>
        </div>
      </dl>
    </PageShell>
  )
}
