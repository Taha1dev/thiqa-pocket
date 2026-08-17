import { Fragment } from "react"
import { useTranslation } from "react-i18next"

import { Separator } from "@/components/ui/separator"
import type { Transaction } from "@/domain/transaction"
import { TransactionRow } from "@/features/dashboard/components/transaction-row"

export function TransactionList({
  transactions,
  locale,
}: {
  readonly transactions: readonly Transaction[]
  readonly locale: string
}) {
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
