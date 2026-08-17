import {
  CheckCircle,
  Clock,
  Copy,
  WarningCircle,
  XCircle,
  type IconProps,
} from "@phosphor-icons/react"
import { useId, type ComponentType, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { sileo } from "sileo"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  SAUDI_IBAN_PATTERN,
  normalizeSaudiIban,
} from "@/domain/money-movement"
import type {
  Transaction,
  TransactionStatus,
} from "@/domain/transaction"
import { cn } from "@/lib/utils"
import { copyToClipboard } from "@/shared/browser/copy-to-clipboard"
import { formatDate } from "@/shared/formatting/format-date"
import { formatMoney } from "@/shared/formatting/format-money"

interface TransactionDetailContentProps {
  readonly transaction: Transaction
  readonly locale: string
  readonly headingLevel?: "h1" | "h2"
}

const statusIcons: Record<TransactionStatus, ComponentType<IconProps>> = {
  completed: CheckCircle,
  pending: Clock,
  failed: XCircle,
}

const statusClassNames: Record<TransactionStatus, string> = {
  completed: "bg-status-completed text-status-completed-foreground",
  pending: "bg-status-pending text-status-pending-foreground",
  failed: "bg-status-failed text-status-failed-foreground",
}

function getAccountDisplay(account: string): string {
  const normalizedAccount = normalizeSaudiIban(account)

  return SAUDI_IBAN_PATTERN.test(normalizedAccount)
    ? `${normalizedAccount.slice(0, 4)} •••• •••• ${normalizedAccount.slice(-4)}`
    : account
}

function MetadataRow({
  label,
  value,
  action,
}: {
  readonly label: string
  readonly value: ReactNode
  readonly action?: ReactNode
}) {
  return (
    <div className="grid gap-1.5 py-4 sm:grid-cols-[minmax(8rem,0.65fr)_minmax(0,1.35fr)] sm:items-center sm:gap-6">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="flex min-w-0 items-center justify-between gap-2 text-sm font-medium sm:justify-end sm:text-end">
        <span className="min-w-0">{value}</span>
        {action}
      </dd>
    </div>
  )
}

function CopyAction({
  value,
  label,
  successTitle,
  successDescription,
}: {
  readonly value: string
  readonly label: string
  readonly successTitle: string
  readonly successDescription: string
}) {
  const { t } = useTranslation("transactions")

  const handleCopy = async () => {
    const copied = await copyToClipboard(value)

    if (copied) {
      sileo.success({ title: successTitle, description: successDescription })
      return
    }

    sileo.error({
      title: t("notifications.copyFailed.title"),
      description: t("notifications.copyFailed.description"),
    })
  }

  return (
    <Button
      aria-label={label}
      className="shrink-0"
      size="icon-xs"
      title={label}
      type="button"
      variant="ghost"
      onClick={() => void handleCopy()}
    >
      <Copy aria-hidden="true" />
    </Button>
  )
}

export function TransactionDetailContent({
  transaction,
  locale,
  headingLevel = "h1",
}: TransactionDetailContentProps) {
  const { t } = useTranslation("transactions")
  const Heading = headingLevel
  const SectionHeading = headingLevel === "h1" ? "h2" : "h3"
  const StatusIcon = statusIcons[transaction.status]
  const amountSign = transaction.type === "credit" ? "+" : "−"
  const account = transaction.counterpartyAccount
  const detailsHeadingId = useId()
  const noteHeadingId = useId()

  return (
    <article className="mx-auto w-full max-w-2xl">
      <header className="flex flex-col items-center text-center">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
            statusClassNames[transaction.status]
          )}
        >
          <StatusIcon aria-hidden="true" weight="fill" />
          {t(`status.${transaction.status}`)}
        </span>

        <bdi
          className={cn(
            "mt-5 financial-value text-4xl font-semibold tracking-[-0.04em] sm:text-5xl",
            transaction.type === "credit" &&
              transaction.status !== "failed" &&
              "text-status-completed-foreground"
          )}
          dir="ltr"
        >
          {amountSign}
          {formatMoney(transaction.amount, locale)}
        </bdi>

        <Heading className="mt-4 text-xl font-semibold tracking-[-0.02em] sm:text-2xl">
          {transaction.counterpartyName}
        </Heading>
        <p className="mt-1 text-sm text-muted-foreground">
          {t(`category.${transaction.category}`)}
        </p>
      </header>

      <section className="mt-8" aria-labelledby={detailsHeadingId}>
        <SectionHeading
          className="text-sm font-semibold tracking-[-0.01em]"
          id={detailsHeadingId}
        >
          {t("detail.detailsHeading")}
        </SectionHeading>
        <dl className="mt-2">
          <MetadataRow
            label={t("detail.date")}
            value={
              <time dateTime={transaction.timestamp}>
                {formatDate(transaction.timestamp, locale)}
              </time>
            }
          />
          <Separator />
          <MetadataRow
            label={t("detail.category")}
            value={t(`category.${transaction.category}`)}
          />
          <Separator />
          <MetadataRow
            label={t("detail.type")}
            value={t(`type.${transaction.type}`)}
          />
          {account ? (
            <>
              <Separator />
              <MetadataRow
                action={
                  <CopyAction
                    label={t("detail.copyAccount")}
                    successDescription={t(
                      "notifications.accountCopied.description"
                    )}
                    successTitle={t("notifications.accountCopied.title")}
                    value={account}
                  />
                }
                label={t("detail.account")}
                value={
                  <bdi
                    className="text-start financial-value break-all sm:text-end"
                    dir="ltr"
                  >
                    {getAccountDisplay(account)}
                  </bdi>
                }
              />
            </>
          ) : null}
          <Separator />
          <MetadataRow
            action={
              <CopyAction
                label={t("detail.copyTransactionId")}
                successDescription={t(
                  "notifications.transactionIdCopied.description"
                )}
                successTitle={t("notifications.transactionIdCopied.title")}
                value={transaction.id}
              />
            }
            label={t("detail.transactionId")}
            value={
              <bdi
                className="text-start financial-value break-all sm:text-end"
                dir="ltr"
              >
                {transaction.id}
              </bdi>
            }
          />
        </dl>
      </section>

      {transaction.note ? (
        <section
          className={cn(
            "mt-6 rounded-2xl p-4",
            transaction.status === "failed"
              ? "bg-status-failed text-status-failed-foreground"
              : "bg-muted/60"
          )}
          aria-labelledby={noteHeadingId}
        >
          <div className="flex items-center gap-2">
            {transaction.status === "failed" ? (
              <WarningCircle aria-hidden="true" weight="fill" />
            ) : null}
            <SectionHeading
              className="text-sm font-semibold"
              id={noteHeadingId}
            >
              {transaction.status === "failed"
                ? t("detail.failureContext")
                : t("detail.note")}
            </SectionHeading>
          </div>
          <p className="mt-1.5 text-sm leading-6">{transaction.note}</p>
        </section>
      ) : null}
    </article>
  )
}

export function TransactionDetailSkeleton() {
  return (
    <div aria-hidden="true" className="mx-auto w-full max-w-2xl">
      <div className="flex flex-col items-center">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="mt-5 h-12 w-56 max-w-full" />
        <Skeleton className="mt-4 h-7 w-44 max-w-full" />
        <Skeleton className="mt-2 h-4 w-20" />
      </div>
      <div className="mt-8">
        <Skeleton className="h-4 w-32" />
        <div className="mt-3 space-y-4">
          {[0, 1, 2, 3].map((item) => (
            <div
              className="flex items-center justify-between gap-6 border-b border-border pb-4"
              key={item}
            >
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-40 max-w-[55%]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
