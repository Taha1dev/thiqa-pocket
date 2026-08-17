import type { RefObject } from "react"
import { CircleNotch, PlusCircle } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { createMoneyFromMinor } from "@/domain/money"
import type { WalletUser } from "@/domain/wallet"
import { SummaryList } from "@/features/money-movement/components/money-movement-ui"
import { getTopUpErrorMessage } from "@/features/top-up/use-top-up-flow"
import { formatMoney } from "@/shared/formatting/format-money"

interface TopUpReviewProps {
  readonly amountMinor: number
  readonly headingRef: RefObject<HTMLHeadingElement | null>
  readonly locale: string
  readonly mutation: {
    readonly error: Error | null
    readonly isError: boolean
    readonly isPending: boolean
  }
  readonly onConfirm: () => void
  readonly onEdit: () => void
  readonly wallet: WalletUser
}

export function TopUpReview({
  amountMinor,
  headingRef,
  locale,
  mutation,
  onConfirm,
  onEdit,
  wallet,
}: TopUpReviewProps) {
  const { t } = useTranslation(["transfer", "common"])

  return (
    <div className="animate-in duration-150 fade-in motion-reduce:animate-none">
      <header>
        <h2
          className="scroll-mt-20 text-xl font-semibold tracking-[-0.02em] outline-none"
          ref={headingRef}
          tabIndex={-1}
        >
          {t("topUp.review.title")}
        </h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {t("topUp.review.description")}
        </p>
      </header>

      <div className="mt-6 rounded-2xl bg-muted/55 px-4 sm:px-5">
        <SummaryList
          rows={[
            {
              label: t("topUp.review.amount"),
              value: (
                <bdi className="financial-value" dir="ltr">
                  {formatMoney(
                    createMoneyFromMinor(amountMinor, "SAR"),
                    locale
                  )}
                </bdi>
              ),
            },
            {
              label: t("topUp.review.source"),
              value: t("topUp.source.bankTransfer"),
            },
            {
              label: t("topUp.review.currentBalance"),
              value: (
                <bdi className="financial-value" dir="ltr">
                  {formatMoney(wallet.balance, locale)}
                </bdi>
              ),
            },
            {
              label: t("topUp.review.balanceAfter"),
              value: (
                <bdi className="financial-value" dir="ltr">
                  {formatMoney(
                    createMoneyFromMinor(
                      wallet.balance.amountMinor + amountMinor,
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
          {getTopUpErrorMessage(mutation.error, {
            invalid_amount: t("topUp.errors.invalid_amount"),
            request_failed: t("topUp.errors.request_failed"),
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
            <PlusCircle aria-hidden="true" data-icon="inline-start" />
          )}
          {mutation.isPending
            ? t("topUp.review.confirming")
            : t("topUp.review.confirmAction")}
        </Button>
        <Button
          aria-disabled={mutation.isPending}
          disabled={mutation.isPending}
          size="lg"
          type="button"
          variant="outline"
          onClick={onEdit}
        >
          {t("topUp.review.editAction")}
        </Button>
      </div>
    </div>
  )
}
