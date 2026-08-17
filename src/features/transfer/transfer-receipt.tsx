import type { RefObject } from "react"
import { useTranslation } from "react-i18next"

import {
  maskSaudiIban,
  type TransferReceipt as Receipt,
} from "@/domain/money-movement"
import { MoneyMovementReceipt } from "@/features/money-movement/components/money-movement-ui"
import { formatDate } from "@/shared/formatting/format-date"
import { formatMoney } from "@/shared/formatting/format-money"

export function TransferReceipt({
  headingRef,
  locale,
  onRepeat,
  receipt,
}: {
  readonly headingRef: RefObject<HTMLHeadingElement | null>
  readonly locale: string
  readonly onRepeat: () => void
  readonly receipt: Receipt
}) {
  const { t } = useTranslation(["transfer", "common"])

  return (
    <MoneyMovementReceipt
      amount={
        <bdi
          className="financial-value text-3xl font-semibold tracking-[-0.035em] sm:text-4xl"
          dir="ltr"
        >
          −{formatMoney(receipt.amount, locale)}
        </bdi>
      }
      dashboardLabel={t("common:actions.backToDashboard")}
      description={t("transfer.receipt.description")}
      headingRef={headingRef}
      onRepeat={onRepeat}
      repeatLabel={t("transfer.receipt.repeatAction")}
      rows={[
        {
          label: t("transfer.receipt.recipient"),
          value: receipt.recipientName,
        },
        {
          label: t("transfer.receipt.iban"),
          value: <bdi dir="ltr">{maskSaudiIban(receipt.iban)}</bdi>,
        },
        {
          label: t("transfer.receipt.newBalance"),
          value: (
            <bdi className="financial-value" dir="ltr">
              {formatMoney(receipt.balanceAfter, locale)}
            </bdi>
          ),
        },
        {
          label: t("transfer.receipt.transactionId"),
          value: (
            <bdi className="financial-value break-all" dir="ltr">
              {receipt.transactionId}
            </bdi>
          ),
        },
        {
          label: t("transfer.receipt.date"),
          value: (
            <time dateTime={receipt.timestamp}>
              {formatDate(receipt.timestamp, locale)}
            </time>
          ),
        },
      ]}
      title={t("transfer.receipt.title")}
    />
  )
}
