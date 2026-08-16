import { useEffect, useMemo, useRef, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { CircleNotch, PaperPlaneTilt } from "@phosphor-icons/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { sileo } from "sileo"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  createMoneyFromMinor,
  parseMoneyInputToMinor,
} from "@/domain/money/money"
import {
  TRANSFER_FIELD_LIMITS,
  TRANSFER_LIMITS,
  formatSaudiIban,
  maskSaudiIban,
  normalizeSaudiIban,
  type TransferCommand,
  type TransferReceipt,
} from "@/domain/money-movement/money-movement"
import type { MoneyMovementRepository } from "@/domain/money-movement/money-movement-repository"
import type { WalletUser } from "@/domain/wallet/wallet"
import {
  FlowProgress,
  MoneyMovementPanel,
  MoneyMovementReceipt,
  SummaryList,
} from "@/features/money-movement/components/money-movement-ui"
import { MoneyMovementToastContent } from "@/features/money-movement/components/money-movement-toast-content"
import {
  createTransferSchema,
  type TransferFormValues,
} from "@/features/money-movement/transfer-schema"
import { applyTransferReceiptToCache } from "@/infrastructure/wallet/money-movement-cache"
import { MoneyMovementError } from "@/shared/errors/money-movement-error"
import { formatDate } from "@/shared/formatting/format-date"
import { formatMoney } from "@/shared/formatting/format-money"

interface TransferFlowProps {
  readonly wallet: WalletUser
  readonly repository: MoneyMovementRepository
}

interface TransferReviewValues {
  readonly recipientName: string
  readonly iban: string
  readonly amountMinor: number
  readonly note: string | null
}

function getRequestErrorMessage(
  error: unknown,
  messages: Record<
    | "insufficient_balance"
    | "invalid_amount"
    | "invalid_iban"
    | "request_failed",
    string
  >
): string {
  if (error instanceof MoneyMovementError) {
    return messages[error.code]
  }

  return messages.request_failed
}

export function TransferFlow({ wallet, repository }: TransferFlowProps) {
  const { t, i18n } = useTranslation(["transfer", "common"])
  const locale = i18n.resolvedLanguage ?? "en"
  const queryClient = useQueryClient()
  const [step, setStep] = useState<"details" | "review">("details")
  const [reviewValues, setReviewValues] = useState<TransferReviewValues | null>(
    null
  )
  const [receipt, setReceipt] = useState<TransferReceipt | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const submissionPendingRef = useRef(false)
  const stateHeadingRef = useRef<HTMLHeadingElement | null>(null)

  useEffect(
    () => () => {
      abortControllerRef.current?.abort()
    },
    []
  )

  useEffect(() => {
    stateHeadingRef.current?.focus()
  }, [receipt, step])

  const minAmount = formatMoney(
    createMoneyFromMinor(TRANSFER_LIMITS.minMinor, "SAR"),
    locale
  )
  const maxAmount = formatMoney(
    createMoneyFromMinor(TRANSFER_LIMITS.maxMinor, "SAR"),
    locale
  )
  const schema = useMemo(
    () =>
      createTransferSchema(
        {
          recipientRequired: t("transfer.validation.recipientRequired"),
          recipientTooShort: t("transfer.validation.recipientTooShort"),
          recipientTooLong: t("transfer.validation.recipientTooLong", {
            count: TRANSFER_FIELD_LIMITS.recipientNameMax,
          }),
          ibanRequired: t("transfer.validation.ibanRequired"),
          ibanInvalid: t("transfer.validation.ibanInvalid"),
          amountRequired: t("transfer.validation.amountRequired"),
          amountInvalid: t("transfer.validation.amountInvalid"),
          amountBelowMinimum: t("transfer.validation.amountBelowMinimum", {
            amount: minAmount,
          }),
          amountAboveMaximum: t("transfer.validation.amountAboveMaximum", {
            amount: maxAmount,
          }),
          amountExceedsBalance: t("transfer.validation.amountExceedsBalance"),
          noteTooLong: t("transfer.validation.noteTooLong", {
            count: TRANSFER_FIELD_LIMITS.noteMax,
          }),
        },
        wallet.balance.amountMinor
      ),
    [maxAmount, minAmount, t, wallet.balance.amountMinor]
  )

  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setValue,
  } = useForm<TransferFormValues>({
    defaultValues: { recipientName: "", iban: "", amount: "", note: "" },
    resolver: zodResolver(schema),
    shouldFocusError: true,
  })

  const mutation = useMutation({
    mutationFn: (command: TransferCommand) => {
      const abortController = new AbortController()
      abortControllerRef.current = abortController
      return repository.transfer(command, abortController.signal)
    },
    onSuccess: (nextReceipt) => {
      applyTransferReceiptToCache(queryClient, nextReceipt)
      setReceipt(nextReceipt)
    },
  })

  const showReview = handleSubmit((values) => {
    const amountMinor = parseMoneyInputToMinor(values.amount)
    if (amountMinor === null) {
      return
    }

    setReviewValues({
      recipientName: values.recipientName.trim(),
      iban: normalizeSaudiIban(values.iban),
      amountMinor,
      note: values.note.trim() || null,
    })
    mutation.reset()
    setStep("review")
  })

  const confirmTransfer = () => {
    if (!reviewValues || submissionPendingRef.current) {
      return
    }

    submissionPendingRef.current = true
    const mutationPromise = mutation.mutateAsync({
      amount: createMoneyFromMinor(reviewValues.amountMinor, "SAR"),
      currentBalance: wallet.balance,
      recipientName: reviewValues.recipientName,
      iban: reviewValues.iban,
      note: reviewValues.note,
    })

    void sileo
      .promise(mutationPromise, {
        loading: {
          title: t("transfer.notifications.pending.title"),
        },
        success: (nextReceipt) => ({
          title: t("transfer.notifications.success.title"),
          description: (
            <MoneyMovementToastContent locale={locale} receipt={nextReceipt} />
          ),
          button: {
            title: t("common:actions.viewReceipt"),
            onClick: () => {
              setReceipt(nextReceipt)
              stateHeadingRef.current?.scrollIntoView?.({ block: "start" })
              stateHeadingRef.current?.focus()
            },
          },
        }),
        error: (error) => ({
          title: t("transfer.notifications.failed.title"),
          description: getRequestErrorMessage(error, {
            insufficient_balance: t("transfer.errors.insufficient_balance"),
            invalid_amount: t("transfer.errors.invalid_amount"),
            invalid_iban: t("transfer.errors.invalid_iban"),
            request_failed: t("transfer.errors.request_failed"),
          }),
        }),
      })
      .catch(() => undefined)
      .finally(() => {
        submissionPendingRef.current = false
        abortControllerRef.current = null
      })
  }

  const startAnotherTransfer = () => {
    reset()
    mutation.reset()
    setReceipt(null)
    setReviewValues(null)
    setStep("details")
  }

  if (receipt) {
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
        headingRef={stateHeadingRef}
        onRepeat={startAnotherTransfer}
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

  return (
    <MoneyMovementPanel>
      <FlowProgress
        current={step}
        detailsLabel={t("steps.details")}
        reviewLabel={t("steps.review")}
      />

      {step === "details" ? (
        <div className="animate-in duration-150 fade-in motion-reduce:animate-none">
          <header>
            <h2
              className="scroll-mt-20 text-xl font-semibold tracking-[-0.02em] outline-none"
              ref={stateHeadingRef}
              tabIndex={-1}
            >
              {t("transfer.details.title")}
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {t("transfer.details.description")}
            </p>
          </header>

          <form className="mt-7" noValidate onSubmit={showReview}>
            <FieldGroup className="gap-5">
              <Field data-invalid={Boolean(errors.recipientName)}>
                <FieldLabel htmlFor="transfer-recipient">
                  {t("transfer.fields.recipient.label")}
                </FieldLabel>
                <Input
                  id="transfer-recipient"
                  autoComplete="name"
                  className="localized-placeholder-direction"
                  dir="auto"
                  aria-describedby={
                    errors.recipientName
                      ? "transfer-recipient-error"
                      : "transfer-recipient-helper"
                  }
                  aria-invalid={Boolean(errors.recipientName)}
                  placeholder={t("transfer.fields.recipient.placeholder")}
                  {...register("recipientName")}
                />
                <FieldDescription id="transfer-recipient-helper">
                  {t("transfer.fields.recipient.helper")}
                </FieldDescription>
                <FieldError id="transfer-recipient-error">
                  {errors.recipientName?.message}
                </FieldError>
              </Field>

              <Field data-invalid={Boolean(errors.iban)}>
                <FieldLabel htmlFor="transfer-iban">
                  {t("transfer.fields.iban.label")}
                </FieldLabel>
                <Input
                  id="transfer-iban"
                  autoCapitalize="characters"
                  autoComplete="off"
                  className="financial-value"
                  dir="ltr"
                  aria-describedby={
                    errors.iban ? "transfer-iban-error" : "transfer-iban-helper"
                  }
                  aria-invalid={Boolean(errors.iban)}
                  placeholder={t("transfer.fields.iban.placeholder")}
                  {...register("iban", {
                    onBlur: (event) => {
                      setValue("iban", formatSaudiIban(event.target.value), {
                        shouldValidate: true,
                      })
                    },
                  })}
                />
                <FieldDescription id="transfer-iban-helper">
                  {t("transfer.fields.iban.helper")}
                </FieldDescription>
                <FieldError id="transfer-iban-error">
                  {errors.iban?.message}
                </FieldError>
              </Field>

              <Field data-invalid={Boolean(errors.amount)}>
                <FieldLabel htmlFor="transfer-amount">
                  {t("transfer.fields.amount.label")}
                </FieldLabel>
                <div className="relative" dir="ltr">
                  <Input
                    id="transfer-amount"
                    autoComplete="off"
                    className="pe-14 financial-value"
                    dir="ltr"
                    inputMode="decimal"
                    aria-describedby={
                      errors.amount
                        ? "transfer-amount-error"
                        : "transfer-amount-helper"
                    }
                    aria-invalid={Boolean(errors.amount)}
                    placeholder={t("transfer.fields.amount.placeholder")}
                    {...register("amount")}
                  />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-xs font-medium text-muted-foreground"
                  >
                    {t("currency.sar")}
                  </span>
                </div>
                <FieldDescription id="transfer-amount-helper">
                  {t("transfer.fields.amount.helperFrom")}{" "}
                  <bdi className="financial-value" dir="ltr">
                    {minAmount}
                  </bdi>{" "}
                  {t("transfer.fields.amount.helperTo")}{" "}
                  <bdi className="financial-value" dir="ltr">
                    {maxAmount}
                  </bdi>
                  . {t("transfer.fields.amount.helperAvailable")}{" "}
                  <bdi className="financial-value" dir="ltr">
                    {formatMoney(wallet.balance, locale)}
                  </bdi>
                  .
                </FieldDescription>
                <FieldError id="transfer-amount-error">
                  {errors.amount?.message}
                </FieldError>
              </Field>

              <Field data-invalid={Boolean(errors.note)}>
                <FieldLabel htmlFor="transfer-note">
                  {t("transfer.fields.note.label")}
                </FieldLabel>
                <textarea
                  id="transfer-note"
                  className="localized-placeholder-direction min-h-24 w-full resize-y rounded-xl border border-input bg-field px-3 py-2 text-base transition-[color,border-color,box-shadow,background-color] duration-150 outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:bg-card focus-visible:ring-3 focus-visible:ring-ring/20 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/15 sm:text-sm"
                  dir="auto"
                  aria-describedby="transfer-note-helper transfer-note-error"
                  aria-invalid={Boolean(errors.note)}
                  placeholder={t("transfer.fields.note.placeholder")}
                  {...register("note")}
                />
                <FieldDescription id="transfer-note-helper">
                  {t("transfer.fields.note.helper", {
                    count: TRANSFER_FIELD_LIMITS.noteMax,
                  })}
                </FieldDescription>
                <FieldError id="transfer-note-error">
                  {errors.note?.message}
                </FieldError>
              </Field>

              <Button className="mt-1 w-full" size="lg" type="submit">
                {t("transfer.details.reviewAction")}
              </Button>
            </FieldGroup>
          </form>
        </div>
      ) : reviewValues ? (
        <div className="animate-in duration-150 fade-in motion-reduce:animate-none">
          <header>
            <h2
              className="scroll-mt-20 text-xl font-semibold tracking-[-0.02em] outline-none"
              ref={stateHeadingRef}
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
                  value: reviewValues.recipientName,
                },
                {
                  label: t("transfer.review.iban"),
                  value: (
                    <bdi dir="ltr">{formatSaudiIban(reviewValues.iban)}</bdi>
                  ),
                },
                {
                  label: t("transfer.review.amount"),
                  value: (
                    <bdi className="financial-value" dir="ltr">
                      {formatMoney(
                        createMoneyFromMinor(reviewValues.amountMinor, "SAR"),
                        locale
                      )}
                    </bdi>
                  ),
                },
                {
                  label: t("transfer.review.note"),
                  value: reviewValues.note ?? t("transfer.review.noNote"),
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
                          wallet.balance.amountMinor - reviewValues.amountMinor,
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
              {getRequestErrorMessage(mutation.error, {
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
              onClick={confirmTransfer}
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
              onClick={() => {
                mutation.reset()
                setStep("details")
              }}
            >
              {t("transfer.review.editAction")}
            </Button>
          </div>
        </div>
      ) : null}
    </MoneyMovementPanel>
  )
}
