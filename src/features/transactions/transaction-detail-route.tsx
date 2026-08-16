import { ArrowLeft, X } from "@phosphor-icons/react"
import { type ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link, useNavigate, useParams } from "react-router"
import { useTranslation } from "react-i18next"

import { routePaths } from "@/app/router/paths"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import type { WalletRepository } from "@/domain/wallet/wallet-repository"
import { Component as DashboardRoute } from "@/features/dashboard/dashboard-route"
import {
  TransactionDetailContent,
  TransactionDetailSkeleton,
} from "@/features/transactions/transaction-detail-content"
import { useTransactionPresentation } from "@/features/transactions/transaction-presentation"
import { walletRepository } from "@/infrastructure/wallet/json-wallet-repository"
import { transactionQueryOptions } from "@/infrastructure/wallet/wallet-queries"
import { cn } from "@/lib/utils"
import { DataValidationError } from "@/shared/errors/data-validation-error"
import { EntityNotFoundError } from "@/shared/errors/entity-not-found-error"
import { RequestError } from "@/shared/errors/request-error"

interface TransactionDetailRouteProps {
  readonly repository?: WalletRepository
  readonly contextualBackground?: ReactNode
}

function DetailStateMessage({
  title,
  message,
  action,
  headingLevel,
  role,
}: {
  readonly title: string
  readonly message: string
  readonly action: ReactNode
  readonly headingLevel: "h1" | "h2"
  readonly role: "alert" | "status"
}) {
  const Heading = headingLevel

  return (
    <div
      className="flex min-h-56 flex-col items-start justify-center"
      role={role}
    >
      <Heading className="text-xl font-semibold tracking-[-0.02em] sm:text-2xl">
        {title}
      </Heading>
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

function ContextualDetailDrawer({
  children,
  onClose,
}: {
  readonly children: ReactNode
  readonly onClose: () => void
}) {
  const { t } = useTranslation("transactions")

  return (
    <Drawer
      open
      showSwipeHandle
      swipeDirection="down"
      onOpenChange={(open) => {
        if (!open) {
          onClose()
        }
      }}
    >
      <DrawerContent className="max-h-[calc(100dvh-0.5rem)] rounded-b-none border-b-0 [--drawer-inset:0px] sm:mx-auto sm:max-h-[min(48rem,calc(100dvh-2rem))] sm:max-w-3xl sm:rounded-b-[min(var(--radius-4xl),24px)] sm:border-b sm:[--drawer-inset:--spacing(4)]">
        <DrawerHeader className="flex-row items-center justify-end p-3 pb-0 text-start">
          <DrawerTitle className="sr-only">
            {t("detail.drawerTitle")}
          </DrawerTitle>
          <DrawerDescription className="sr-only">
            {t("detail.drawerDescription")}
          </DrawerDescription>
          <DrawerClose
            render={
              <Button
                aria-label={t("detail.close")}
                size="icon-sm"
                variant="ghost"
              />
            }
          >
            <X aria-hidden="true" />
          </DrawerClose>
        </DrawerHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-2 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-7 sm:pt-4">
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  )
}

export function TransactionDetailRoute({
  repository = walletRepository,
  contextualBackground,
}: TransactionDetailRouteProps = {}) {
  const { transactionId = "" } = useParams()
  const { t, i18n } = useTranslation(["transactions", "common"])
  const navigate = useNavigate()
  const { presentation } = useTransactionPresentation()
  const transactionQuery = useQuery(
    transactionQueryOptions(repository, transactionId)
  )
  const isContextual = presentation?.transactionId === transactionId
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
        headingLevel={isContextual ? "h2" : "h1"}
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
        headingLevel={isContextual ? "h2" : "h1"}
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
        headingLevel={isContextual ? "h2" : "h1"}
        locale={locale}
        transaction={transactionQuery.data}
      />
    )
  }

  if (isContextual) {
    return (
      <>
        {contextualBackground ?? <DashboardRoute />}
        <ContextualDetailDrawer onClose={() => navigate(-1)}>
          {detailContent}
        </ContextualDetailDrawer>
      </>
    )
  }

  return <StandaloneDetailFrame>{detailContent}</StandaloneDetailFrame>
}

export function Component() {
  return <TransactionDetailRoute />
}
