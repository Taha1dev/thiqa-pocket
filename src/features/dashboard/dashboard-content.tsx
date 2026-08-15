import { Fragment, type ComponentType } from "react"
import {
  ArrowCounterClockwise,
  CaretRight,
  ChatCircleDots,
  CheckCircle,
  Clock,
  PaperPlaneTilt,
  Plus,
  Receipt,
  ShoppingBag,
  XCircle,
  type IconProps,
} from "@phosphor-icons/react"
import { Link } from "react-router"
import { useTranslation } from "react-i18next"

import { getTransactionPath, routePaths } from "@/app/router/paths"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import type {
  Transaction,
  TransactionCategory,
  TransactionStatus,
} from "@/domain/transaction/transaction"
import type { WalletUser } from "@/domain/wallet/wallet"
import { cn } from "@/lib/utils"
import { formatDate } from "@/shared/formatting/format-date"
import { formatMoney } from "@/shared/formatting/format-money"

interface DashboardContentProps {
  readonly wallet: WalletUser
  readonly transactions: readonly Transaction[]
  readonly locale: string
}

interface QuickAction {
  readonly path: string
  readonly translationKey:
    "quickActions.transfer" | "quickActions.topUp" | "quickActions.assistant"
  readonly icon: ComponentType<IconProps>
}

const quickActions: readonly QuickAction[] = [
  {
    path: routePaths.transfer,
    translationKey: "quickActions.transfer",
    icon: PaperPlaneTilt,
  },
  {
    path: routePaths.topUp,
    translationKey: "quickActions.topUp",
    icon: Plus,
  },
  {
    path: routePaths.assistant,
    translationKey: "quickActions.assistant",
    icon: ChatCircleDots,
  },
]

const categoryIcons: Record<TransactionCategory, ComponentType<IconProps>> = {
  transfer: PaperPlaneTilt,
  top_up: Plus,
  bill_payment: Receipt,
  purchase: ShoppingBag,
  refund: ArrowCounterClockwise,
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

function WalletBalanceCard({
  wallet,
  locale,
}: Pick<DashboardContentProps, "wallet" | "locale">) {
  const { t } = useTranslation("wallet")
  const accountEnding =
    wallet.id.split("_").at(-1)?.slice(-4) ?? wallet.id.slice(-4)

  return (
    <section
      aria-labelledby="wallet-balance-title"
      className="relative flex min-h-64 flex-col justify-between overflow-hidden rounded-3xl wallet-card-pattern p-6 text-wallet-foreground elevated-surface sm:min-h-72 sm:p-8"
    >
      <div
        aria-hidden="true"
        className="absolute inset-s-6 top-0 h-0.5 w-14 rounded-b-full bg-brand-gold sm:inset-s-8"
      />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            id="wallet-balance-title"
            className="text-sm font-medium text-wallet-muted"
          >
            {t("balance.label")}
          </p>
          <p className="mt-1 text-xs text-wallet-muted/80">
            {t("balance.personalWallet")}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-wallet-muted/20 bg-white/5 px-2.5 py-1 text-xs text-wallet-muted">
          <span
            aria-hidden="true"
            className="size-1.5 rounded-full bg-brand-jade"
          />
          {t("balance.available")}
        </span>
      </div>

      <div className="relative">
        <bdi
          className="block financial-value text-3xl font-semibold tracking-[-0.035em] sm:text-5xl"
          dir="ltr"
        >
          {formatMoney(wallet.balance, locale)}
        </bdi>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs text-wallet-muted">
          <span>{wallet.name}</span>
          <span>
            {t("balance.accountEnding")}{" "}
            <bdi className="financial-value" dir="ltr">
              •••• {accountEnding}
            </bdi>
          </span>
        </div>
      </div>
    </section>
  )
}

function QuickActions() {
  const { t } = useTranslation("wallet")

  return (
    <section
      aria-labelledby="quick-actions-title"
      className="rounded-3xl bg-secondary/65 p-4 sm:p-5"
    >
      <h2
        id="quick-actions-title"
        className="mb-3 text-sm font-semibold tracking-[-0.01em] sm:mb-4"
      >
        {t("quickActions.title")}
      </h2>
      <ul className="grid grid-cols-3 gap-2 lg:grid-cols-1">
        {quickActions.map((action) => {
          const Icon = action.icon

          return (
            <li key={action.path}>
              <Link
                className="group flex min-h-20 pressable flex-col items-center justify-center gap-2 rounded-2xl bg-card/75 p-2.5 text-center text-xs font-medium hover:bg-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:text-sm lg:min-h-16 lg:flex-row lg:justify-start lg:px-3 lg:text-start"
                to={action.path}
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon
                    aria-hidden="true"
                    className="size-[1.05rem]"
                  />
                </span>
                <span>{t(action.translationKey)}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function TransactionRow({
  transaction,
  locale,
}: {
  readonly transaction: Transaction
  readonly locale: string
}) {
  const { t } = useTranslation("transactions")
  const CategoryIcon = categoryIcons[transaction.category]
  const StatusIcon = statusIcons[transaction.status]
  const amountSign = transaction.type === "credit" ? "+" : "−"

  return (
    <Link
      className="group grid pressable grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl px-2 py-3 hover:bg-muted/70 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring sm:gap-4 sm:px-3 sm:py-3.5"
      to={getTransactionPath(transaction.id)}
    >
      <span className="grid size-10 place-items-center rounded-xl bg-accent text-accent-foreground sm:size-11">
        <CategoryIcon
          aria-hidden="true"
          className="size-[1.15rem]"
        />
      </span>

      <span className="min-w-0">
        <span className="block truncate text-sm font-medium sm:text-[0.95rem]">
          {transaction.counterpartyName}
        </span>
        <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          <span className="truncate">
            {t(`category.${transaction.category}`)}
          </span>
          <span aria-hidden="true">·</span>
          <time className="truncate" dateTime={transaction.timestamp}>
            {formatDate(transaction.timestamp, locale)}
          </time>
        </span>
      </span>

      <span className="flex min-w-0 items-center gap-2 text-end">
        <span className="flex min-w-0 flex-col items-end gap-1.5">
          <bdi
            className={cn(
              "financial-value text-sm font-semibold whitespace-nowrap",
              transaction.type === "credit" &&
                transaction.status !== "failed" &&
                "text-status-completed-foreground"
            )}
            dir="ltr"
          >
            {amountSign}
            {formatMoney(transaction.amount, locale)}
          </bdi>
          <Badge
            className={cn(
              "h-5 gap-1 border-0 px-1.5 text-[0.65rem]",
              statusClassNames[transaction.status]
            )}
            variant="secondary"
          >
            <StatusIcon

              aria-hidden="true"
              data-icon="inline-start"
              weight="fill"
            />
            {t(`status.${transaction.status}`)}
          </Badge>
        </span>
        <CaretRight
          aria-hidden="true"
          className="hidden size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 sm:block rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
        />
      </span>
    </Link>
  )
}

function TransactionActivity({
  transactions,
  locale,
}: Pick<DashboardContentProps, "transactions" | "locale">) {
  const { t } = useTranslation("wallet")

  return (
    <section
      aria-labelledby="recent-activity-title"
      className="rounded-3xl border border-border/70 bg-card p-3 elevated-surface sm:p-5"
    >
      <header className="flex items-end justify-between gap-4 px-2 pt-1 pb-3 sm:px-3 sm:pb-4">
        <div>
          <h2
            id="recent-activity-title"
            className="text-lg font-semibold tracking-[-0.02em]"
          >
            {t("activity.title")}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
            {t("activity.description")}
          </p>
        </div>
        {transactions.length > 0 ? (
          <span className="shrink-0 financial-value text-xs text-muted-foreground">
            {t("activity.count", { count: transactions.length })}
          </span>
        ) : null}
      </header>

      {transactions.length === 0 ? (
        <div className="rounded-2xl bg-muted/60 px-4 py-10 text-center text-sm text-muted-foreground">
          {t("activity.empty")}
        </div>
      ) : (
        <div>
          {transactions.map((transaction, index) => (
            <Fragment key={transaction.id}>
              <TransactionRow locale={locale} transaction={transaction} />
              {index < transactions.length - 1 ? (
                <div className="px-14 sm:px-16">
                  <Separator />
                </div>
              ) : null}
            </Fragment>
          ))}
        </div>
      )}
    </section>
  )
}

export function DashboardContent({
  wallet,
  transactions,
  locale,
}: DashboardContentProps) {
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(17rem,0.45fr)] lg:gap-5">
        <WalletBalanceCard locale={locale} wallet={wallet} />
        <QuickActions />
      </div>
      <TransactionActivity locale={locale} transactions={transactions} />
    </>
  )
}

export function DashboardSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(17rem,0.45fr)] lg:gap-5">
        <Skeleton className="min-h-64 rounded-3xl sm:min-h-72" />
        <div className="rounded-3xl bg-secondary/55 p-5">
          <Skeleton className="mb-4 h-4 w-24" />
          <div className="grid grid-cols-3 gap-2 lg:grid-cols-1">
            <Skeleton className="h-20 rounded-2xl lg:h-16" />
            <Skeleton className="h-20 rounded-2xl lg:h-16" />
            <Skeleton className="h-20 rounded-2xl lg:h-16" />
          </div>
        </div>
      </div>
      <div className="rounded-3xl border bg-card p-5">
        <Skeleton className="mb-5 h-6 w-40" />
        <div className="space-y-3">
          {[0, 1, 2, 3].map((item) => (
            <Skeleton className="h-16 rounded-2xl" key={item} />
          ))}
        </div>
      </div>
    </div>
  )
}
