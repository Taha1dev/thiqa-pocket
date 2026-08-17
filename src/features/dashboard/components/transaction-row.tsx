import {
  ArrowCounterClockwise,
  CaretRight,
  CheckCircle,
  Clock,
  PaperPlaneTilt,
  Plus,
  Receipt,
  ShoppingBag,
  XCircle,
  type IconProps,
} from "@phosphor-icons/react"
import type { ComponentType } from "react"
import { Link } from "react-router"
import { useTranslation } from "react-i18next"

import { getTransactionPath } from "@/app/routes/paths"
import { Badge } from "@/components/ui/badge"
import type {
  Transaction,
  TransactionCategory,
  TransactionStatus,
} from "@/domain/transaction"
import { cn } from "@/lib/utils"
import { formatDate } from "@/shared/formatting/format-date"
import { formatMoney } from "@/shared/formatting/format-money"

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

export function TransactionRow({
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
        <CategoryIcon aria-hidden="true" className="size-[1.15rem]" />
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
