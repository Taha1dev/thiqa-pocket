import type { RefObject } from "react"
import { CircleNotch, PaperPlaneTilt } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { createMoneyFromMinor } from "@/domain/money"
import { formatSaudiIban } from "@/domain/money-movement"
import type { WalletUser } from "@/domain/wallet"
import { SummaryList } from "@/features/money-movement/components/money-movement-ui"
import {
  getTransferErrorMessage,
  type TransferReviewValues,
} from "@/features/transfer/use-transfer-flow"
import { formatMoney } from "@/shared/formatting/format-money"

interface TransferReviewProps {
  readonly headingRef: RefObject<HTMLHeadingElement | null>
  readonly locale: string
  readonly mutation: {
    readonly error: Error | null
    readonly isError: boolean
    readonly isPending: boolean
  }
  readonly onConfirm: () => void
  readonly onEdit: () => void
  readonly values: TransferReviewValues
  readonly wallet: WalletUser
}

export function TransferReview({
  headingRef,
  locale,
  mutation,
  onConfirm,
  onEdit,
  values,
  wallet,
}: TransferReviewProps) {
  const { t } = useTranslation(["transfer", "common"])

  return (
    <div className="animate-in duration-150 fade-in motion-reduce:animate-none">
      <header>
        <h2
          className="scroll-mt-20 text-xl font-semibold tracking-[-0.02em] outline-none"
          ref={headingRef}
          tabIndex={-1}
        >
          {t("transfer.review.title")}
        </h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {t("transfer.review.description")}
        </p>
      </header>

      <div className="mt-6 rounded-2xl bg-muted/55 px-4 sm:px-5">
        <SummaryList
          rows={[
            {
              label: t("transfer.review.recipient"),
              value: values.recipientName,
            },
            {
              label: t("transfer.review.iban"),
              value: <bdi dir="ltr">{formatSaudiIban(values.iban)}</bdi>,
            },
            {
              label: t("transfer.review.amount"),
              value: (
                <bdi className="financial-value" dir="ltr">
                  {formatMoney(
                    createMoneyFromMinor(values.amountMinor, "SAR"),
                    locale
                  )}
                </bdi>
              ),
            },
            {
              label: t("transfer.review.note"),
              value: values.note ?? t("transfer.review.noNote"),
            },
            {
              label: t("transfer.review.availableBalance"),
              value: (
                <bdi className="financial-value" dir="ltr">
                  {formatMoney(wallet.balance, locale)}
                </bdi>
              ),
            },
            {
              label: t("transfer.review.balanceAfter"),
              value: (
                <bdi className="financial-value" dir="ltr">
                  {formatMoney(
                    createMoneyFromMinor(
                      wallet.balance.amountMinor - values.amountMinor,
                      "SAR"
                    ),
                    locale
                  )}
                </bdi>
              ),
            },
          ]}
        />
      </div>

      {mutation.isError ? (
        <p
          className="mt-4 rounded-xl bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
          role="alert"
        >
          {getTransferErrorMessage(mutation.error, {
            insufficient_balance: t("transfer.errors.insufficient_balance"),
            invalid_amount: t("transfer.errors.invalid_amount"),
            invalid_iban: t("transfer.errors.invalid_iban"),
            request_failed: t("transfer.errors.request_failed"),
          })}
        </p>
      ) : null}

      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        <Button
          aria-disabled={mutation.isPending}
          disabled={mutation.isPending}
          size="lg"
          type="button"
          onClick={onConfirm}
        >
          {mutation.isPending ? (
            <CircleNotch
              aria-hidden="true"
              className="animate-spin"
              data-icon="inline-start"
            />
          ) : (
            <PaperPlaneTilt aria-hidden="true" data-icon="inline-start" />
          )}
          {mutation.isPending
            ? t("transfer.review.confirming")
            : t("transfer.review.confirmAction")}
        </Button>
        <Button
          aria-disabled={mutation.isPending}
          disabled={mutation.isPending}
          size="lg"
          type="button"
          variant="outline"
          onClick={onEdit}
        >
          {t("transfer.review.editAction")}
        </Button>
      </div>
    </div>
  )
}
