import { useEffect, useMemo, useRef, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { CircleNotch, PlusCircle } from "@phosphor-icons/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm, useWatch } from "react-hook-form"
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
  TOP_UP_LIMITS,
  TOP_UP_PRESETS_MINOR,
  type TopUpCommand,
  type TopUpReceipt,
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
  createTopUpSchema,
  type TopUpFormValues,
} from "@/features/money-movement/top-up-schema"
import { applyTopUpReceiptToCache } from "@/infrastructure/wallet/money-movement-cache"
import { MoneyMovementError } from "@/shared/errors/money-movement-error"
import { formatDate } from "@/shared/formatting/format-date"
import { formatMoney } from "@/shared/formatting/format-money"
import { cn } from "@/lib/utils"

interface TopUpFlowProps {
  readonly wallet: WalletUser
  readonly repository: MoneyMovementRepository
}

function getRequestErrorMessage(
  error: unknown,
  messages: Record<"invalid_amount" | "request_failed", string>
): string {
  if (error instanceof MoneyMovementError && error.code === "invalid_amount") {
    return messages.invalid_amount
  }

  return messages.request_failed
}

export function TopUpFlow({ wallet, repository }: TopUpFlowProps) {
  const { t, i18n } = useTranslation(["transfer", "common"])
  const locale = i18n.resolvedLanguage ?? "en"
  const queryClient = useQueryClient()
  const [step, setStep] = useState<"details" | "review">("details")
  const [reviewAmountMinor, setReviewAmountMinor] = useState<number | null>(
    null
  )
  const [receipt, setReceipt] = useState<TopUpReceipt | null>(null)
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
    createMoneyFromMinor(TOP_UP_LIMITS.minMinor, "SAR"),
    locale
  )
  const maxAmount = formatMoney(
    createMoneyFromMinor(TOP_UP_LIMITS.maxMinor, "SAR"),
    locale
  )
  const schema = useMemo(
    () =>
      createTopUpSchema({
        amountRequired: t("topUp.validation.amountRequired"),
        amountInvalid: t("topUp.validation.amountInvalid"),
        amountBelowMinimum: t("topUp.validation.amountBelowMinimum", {
          amount: minAmount,
        }),
        amountAboveMaximum: t("topUp.validation.amountAboveMaximum", {
          amount: maxAmount,
        }),
      }),
    [maxAmount, minAmount, t]
  )

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setValue,
  } = useForm<TopUpFormValues>({
    defaultValues: { amount: "" },
    resolver: zodResolver(schema),
    shouldFocusError: true,
  })
  const selectedAmount = useWatch({ control, name: "amount" })

  const mutation = useMutation({
    mutationFn: (command: TopUpCommand) => {
      const abortController = new AbortController()
      abortControllerRef.current = abortController
      return repository.topUp(command, abortController.signal)
    },
    onSuccess: (nextReceipt) => {
      applyTopUpReceiptToCache(
        queryClient,
        nextReceipt,
        t("topUp.source.bankTransfer")
      )
      setReceipt(nextReceipt)
    },
  })

  const showReview = handleSubmit((values) => {
    const amountMinor = parseMoneyInputToMinor(values.amount)
    if (amountMinor === null) {
      return
    }

    setReviewAmountMinor(amountMinor)
    mutation.reset()
    setStep("review")
  })

  const confirmTopUp = () => {
    if (reviewAmountMinor === null || submissionPendingRef.current) {
      return
    }

    submissionPendingRef.current = true
    const mutationPromise = mutation.mutateAsync({
      amount: createMoneyFromMinor(reviewAmountMinor, "SAR"),
      currentBalance: wallet.balance,
      source: "bank_transfer",
    })

    void sileo
      .promise(mutationPromise, {
        loading: {
          title: t("topUp.notifications.pending.title"),
        },
        success: (nextReceipt) => ({
          title: t("topUp.notifications.success.title"),
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
          title: t("topUp.notifications.failed.title"),
          description: getRequestErrorMessage(error, {
            invalid_amount: t("topUp.errors.invalid_amount"),
            request_failed: t("topUp.errors.request_failed"),
          }),
        }),
      })
      .catch(() => undefined)
      .finally(() => {
        submissionPendingRef.current = false
        abortControllerRef.current = null
      })
  }

  const startAnotherTopUp = () => {
    reset()
    mutation.reset()
    setReceipt(null)
    setReviewAmountMinor(null)
    setStep("details")
  }

  if (receipt) {
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
        headingRef={stateHeadingRef}
        onRepeat={startAnotherTopUp}
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

  return (
    <MoneyMovementPanel>
      <FlowProgress
        current={step}
        detailsLabel={t("steps.amount")}
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
              {t("topUp.details.title")}
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {t("topUp.details.description")}
            </p>
          </header>

          <form className="mt-7" noValidate onSubmit={showReview}>
            <FieldGroup className="gap-6">
              <fieldset>
                <legend className="text-sm font-medium">
                  {t("topUp.fields.presets.label")}
                </legend>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {TOP_UP_PRESETS_MINOR.map((amountMinor) => {
                    const amountMajor = String(amountMinor / 100)
                    const isSelected = selectedAmount === amountMajor

                    return (
                      <Button
                        aria-pressed={isSelected}
                        className={cn(
                          "h-11 px-2 financial-value",
                          isSelected &&
                            "border-primary bg-accent text-accent-foreground"
                        )}
                        key={amountMinor}
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setValue("amount", amountMajor, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                      >
                        <bdi dir="ltr">
                          {formatMoney(
                            createMoneyFromMinor(amountMinor, "SAR"),
                            locale
                          )}
                        </bdi>
                      </Button>
                    )
                  })}
                </div>
              </fieldset>

              <Field data-invalid={Boolean(errors.amount)}>
                <FieldLabel htmlFor="top-up-amount">
                  {t("topUp.fields.amount.label")}
                </FieldLabel>
                <div className="relative" dir="ltr">
                  <Input
                    id="top-up-amount"
                    autoComplete="off"
                    className="pe-14 financial-value"
                    dir="ltr"
                    inputMode="decimal"
                    aria-describedby={
                      errors.amount
                        ? "top-up-amount-error"
                        : "top-up-amount-helper"
                    }
                    aria-invalid={Boolean(errors.amount)}
                    placeholder={t("topUp.fields.amount.placeholder")}
                    {...register("amount")}
                  />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-xs font-medium text-muted-foreground"
                  >
                    {t("currency.sar")}
                  </span>
                </div>
                <FieldDescription id="top-up-amount-helper">
                  {t("topUp.fields.amount.helperFrom")}{" "}
                  <bdi className="financial-value" dir="ltr">
                    {minAmount}
                  </bdi>{" "}
                  {t("topUp.fields.amount.helperTo")}{" "}
                  <bdi className="financial-value" dir="ltr">
                    {maxAmount}
                  </bdi>
                  .
                </FieldDescription>
                <FieldError id="top-up-amount-error">
                  {errors.amount?.message}
                </FieldError>
              </Field>

              <aside className="rounded-2xl bg-muted/55 p-4">
                <p className="text-sm font-medium">
                  {t("topUp.source.bankTransfer")}
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {t("topUp.source.disclaimer")}
                </p>
              </aside>

              <Button className="w-full" size="lg" type="submit">
                {t("topUp.details.reviewAction")}
              </Button>
            </FieldGroup>
          </form>
        </div>
      ) : reviewAmountMinor !== null ? (
        <div className="animate-in duration-150 fade-in motion-reduce:animate-none">
          <header>
            <h2
              className="scroll-mt-20 text-xl font-semibold tracking-[-0.02em] outline-none"
              ref={stateHeadingRef}
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
                        createMoneyFromMinor(reviewAmountMinor, "SAR"),
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
                          wallet.balance.amountMinor + reviewAmountMinor,
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
              onClick={confirmTopUp}
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
              onClick={() => {
                mutation.reset()
                setStep("details")
              }}
            >
              {t("topUp.review.editAction")}
            </Button>
          </div>
        </div>
      ) : null}
    </MoneyMovementPanel>
  )
}
