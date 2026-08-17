import { ArrowLeft } from "@phosphor-icons/react"
import { type ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link, useParams } from "react-router"
import { useTranslation } from "react-i18next"

import { routePaths } from "@/app/routes/paths"
import { Button, buttonVariants } from "@/components/ui/button"
import type { WalletRepository } from "@/data/wallet-repository"
import {
  TransactionDetailContent,
  TransactionDetailSkeleton,
} from "@/features/transactions/transaction-detail-content"
import { walletRepository } from "@/data/wallet-repository"
import { transactionQueryOptions } from "@/data/wallet-queries"
import { cn } from "@/lib/utils"
import {
  DataValidationError,
  EntityNotFoundError,
  RequestError,
} from "@/shared/errors/errors"

interface TransactionPageProps {
  readonly repository?: WalletRepository
}

function DetailStateMessage({
  title,
  message,
  action,
  role,
}: {
  readonly title: string
  readonly message: string
  readonly action: ReactNode
  readonly role: "alert" | "status"
}) {
  return (
    <div
      className="flex min-h-56 flex-col items-start justify-center"
      role={role}
    >
      <h1 className="text-xl font-semibold tracking-[-0.02em] sm:text-2xl">
        {title}
      </h1>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {message}
      </p>
      <div className="mt-5">{action}</div>
    </div>
  )
}

function StandaloneDetailFrame({ children }: { readonly children: ReactNode }) {
  const { t } = useTranslation("transactions")

  return (
    <section className="mx-auto w-full max-w-3xl">
      <Link
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "-ms-2 mb-4 w-fit"
        )}
        to={routePaths.dashboard}
      >
        <ArrowLeft
          aria-hidden="true"
          className="rtl:rotate-180"
          data-icon="inline-start"
        />
        {t("detail.backToActivity")}
      </Link>
      <div className="rounded-3xl border border-border/70 bg-card p-5 elevated-surface sm:p-8 lg:p-10">
        {children}
      </div>
    </section>
  )
}

export function TransactionPage({
  repository = walletRepository,
}: TransactionPageProps = {}) {
  const { transactionId = "" } = useParams()
  const { t, i18n } = useTranslation(["transactions", "common"])
  const transactionQuery = useQuery(
    transactionQueryOptions(repository, transactionId)
  )
  const locale = i18n.resolvedLanguage ?? "en"

  let detailContent: ReactNode

  if (
    transactionQuery.isPending ||
    (transactionQuery.isFetching && !transactionQuery.data)
  ) {
    detailContent = (
      <>
        <span className="sr-only" role="status">
          {t("common:states.loading")}
        </span>
        <TransactionDetailSkeleton />
      </>
    )
  } else if (transactionQuery.error instanceof EntityNotFoundError) {
    detailContent = (
      <DetailStateMessage
        message={t("detail.notFoundDescription")}
        role="status"
        title={t("detail.notFoundTitle")}
        action={
          <Link
            className={buttonVariants({ variant: "outline" })}
            to={routePaths.dashboard}
          >
            {t("common:actions.backToDashboard")}
          </Link>
        }
      />
    )
  } else if (transactionQuery.error) {
    const message =
      transactionQuery.error instanceof DataValidationError
        ? t("errors.invalidData")
        : transactionQuery.error instanceof RequestError
          ? t("errors.unavailable")
          : t("errors.generic")

    detailContent = (
      <DetailStateMessage
        action={
          <Button
            type="button"
            variant="outline"
            onClick={() => void transactionQuery.refetch()}
          >
            {t("common:actions.retry")}
          </Button>
        }
        message={message}
        role="alert"
        title={t("detail.errorTitle")}
      />
    )
  } else {
    detailContent = (
      <TransactionDetailContent
        headingLevel="h1"
        locale={locale}
        transaction={transactionQuery.data}
      />
    )
  }

  return <StandaloneDetailFrame>{detailContent}</StandaloneDetailFrame>
}
