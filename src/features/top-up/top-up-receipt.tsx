import type { RefObject } from "react"
import { useTranslation } from "react-i18next"

import type { TopUpReceipt as Receipt } from "@/domain/money-movement"
import { MoneyMovementReceipt } from "@/features/money-movement/components/money-movement-ui"
import { formatDate } from "@/shared/formatting/format-date"
import { formatMoney } from "@/shared/formatting/format-money"

interface TopUpReceiptProps {
  readonly headingRef: RefObject<HTMLHeadingElement | null>
  readonly locale: string
  readonly onRepeat: () => void
  readonly receipt: Receipt
}

export function TopUpReceipt({
  headingRef,
  locale,
  onRepeat,
  receipt,
}: TopUpReceiptProps) {
  const { t } = useTranslation(["transfer", "common"])

  return (
    <MoneyMovementReceipt
      amount={
        <bdi
          className="financial-value text-3xl font-semibold tracking-[-0.035em] text-status-completed-foreground sm:text-4xl"
          dir="ltr"
        >
          +{formatMoney(receipt.amount, locale)}
        </bdi>
      }
      dashboardLabel={t("common:actions.backToDashboard")}
      description={t("topUp.receipt.description")}
      headingRef={headingRef}
      onRepeat={onRepeat}
      repeatLabel={t("topUp.receipt.repeatAction")}
      rows={[
        {
          label: t("topUp.receipt.newBalance"),
          value: (
            <bdi className="financial-value" dir="ltr">
              {formatMoney(receipt.balanceAfter, locale)}
            </bdi>
          ),
        },
        {
          label: t("topUp.receipt.source"),
          value: t("topUp.source.bankTransfer"),
        },
        {
          label: t("topUp.receipt.transactionId"),
          value: (
            <bdi className="financial-value break-all" dir="ltr">
              {receipt.transactionId}
            </bdi>
          ),
        },
        {
          label: t("topUp.receipt.date"),
          value: (
            <time dateTime={receipt.timestamp}>
              {formatDate(receipt.timestamp, locale)}
            </time>
          ),
        },
      ]}
      title={t("topUp.receipt.title")}
    />
  )
}
