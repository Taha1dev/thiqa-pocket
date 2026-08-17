import { ArrowRight, Bank, User, Wallet } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"

import type { TopUpReceipt, TransferReceipt } from "@/domain/money-movement"
import { normalizeSaudiIban } from "@/domain/money-movement"
import { formatMoney } from "@/shared/formatting/format-money"

type MoneyMovementToastContentProps =
  | {
      readonly receipt: TransferReceipt
      readonly locale: string
    }
  | {
      readonly receipt: TopUpReceipt
      readonly locale: string
    }

function maskIbanForToast(value: string): string {
  const normalized = normalizeSaudiIban(value)
  return `${normalized.slice(0, 4)} \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 ${normalized.slice(-4)}`
}

export function MoneyMovementToastContent({
  receipt,
  locale,
}: MoneyMovementToastContentProps) {
  const { t } = useTranslation("transfer")
  const isTransfer = receipt.kind === "transfer"
  const sourceLabel = isTransfer
    ? t("transfer.notifications.summary.wallet")
    : t("topUp.source.bankTransfer")
  const destinationLabel = isTransfer
    ? receipt.recipientName
    : t("topUp.notifications.summary.wallet")
  const SourceIcon = isTransfer ? Wallet : Bank
  const DestinationIcon = isTransfer ? User : Wallet

  return (
    <div className="money-movement-toast grid min-w-0 gap-3 text-start">
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="money-movement-toast__divider grid size-7 shrink-0 place-items-center rounded-full border">
            <SourceIcon aria-hidden="true" className="size-3.5" weight="fill" />
          </span>
          <span className="truncate text-xs font-medium">{sourceLabel}</span>
        </div>
        <ArrowRight
          aria-hidden="true"
          className="money-movement-toast__muted size-4 shrink-0 rtl:rotate-180"
        />
        <div className="flex min-w-0 items-center justify-end gap-2">
          <span className="truncate text-xs font-medium">
            {destinationLabel}
          </span>
          <span className="money-movement-toast__divider grid size-7 shrink-0 place-items-center rounded-full border">
            <DestinationIcon
              aria-hidden="true"
              className="size-3.5"
              weight="fill"
            />
          </span>
        </div>
      </div>

      <div className="money-movement-toast__divider flex min-w-0 items-end justify-between gap-3 border-t pt-3">
        <bdi
          className="financial-value text-xl font-semibold tracking-tight"
          dir="ltr"
        >
          {isTransfer ? "\u2212" : "+"}
          {formatMoney(receipt.amount, locale)}
        </bdi>

        {isTransfer ? (
          <bdi
            className="money-movement-toast__muted min-w-0 truncate financial-value text-xs"
            dir="ltr"
          >
            {maskIbanForToast(receipt.iban)}
          </bdi>
        ) : (
          <dl className="min-w-0 text-end">
            <dt className="money-movement-toast__muted text-[0.6875rem]">
              {t("topUp.receipt.newBalance")}
            </dt>
            <dd className="mt-0.5 truncate financial-value text-xs font-medium">
              <bdi dir="ltr">{formatMoney(receipt.balanceAfter, locale)}</bdi>
            </dd>
          </dl>
        )}
      </div>
    </div>
  )
}
