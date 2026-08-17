import { createElement, useEffect, useMemo, useRef, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { sileo } from "sileo"

import { applyTopUpReceiptToCache } from "@/data/money-movement-cache"
import type { MoneyMovementRepository } from "@/data/money-movement-repository"
import { createMoneyFromMinor, parseMoneyInputToMinor } from "@/domain/money"
import {
  TOP_UP_LIMITS,
  type TopUpCommand,
  type TopUpReceipt,
} from "@/domain/money-movement"
import type { WalletUser } from "@/domain/wallet"
import { MoneyMovementToastContent } from "@/features/money-movement/components/money-movement-toast-content"
import {
  createTopUpSchema,
  type TopUpFormValues,
} from "@/features/top-up/schema"
import { MoneyMovementError } from "@/shared/errors/errors"
import { formatMoney } from "@/shared/formatting/format-money"

export function getTopUpErrorMessage(
  error: unknown,
  messages: Record<"invalid_amount" | "request_failed", string>
): string {
  if (error instanceof MoneyMovementError && error.code === "invalid_amount") {
    return messages.invalid_amount
  }

  return messages.request_failed
}

export function useTopUpFlow(
  wallet: WalletUser,
  repository: MoneyMovementRepository
) {
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

  const form = useForm<TopUpFormValues>({
    defaultValues: { amount: "" },
    resolver: zodResolver(schema),
    shouldFocusError: true,
  })
  const selectedAmount = useWatch({ control: form.control, name: "amount" })

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

  const showReview = form.handleSubmit((values) => {
    const amountMinor = parseMoneyInputToMinor(values.amount)
    if (amountMinor === null) return

    setReviewAmountMinor(amountMinor)
    mutation.reset()
    setStep("review")
  })

  const confirmTopUp = () => {
    if (reviewAmountMinor === null || submissionPendingRef.current) return

    submissionPendingRef.current = true
    const mutationPromise = mutation.mutateAsync({
      amount: createMoneyFromMinor(reviewAmountMinor, "SAR"),
      currentBalance: wallet.balance,
      source: "bank_transfer",
    })

    void sileo
      .promise(mutationPromise, {
        loading: { title: t("topUp.notifications.pending.title") },
        success: (nextReceipt) => ({
          title: t("topUp.notifications.success.title"),
          description: createElement(MoneyMovementToastContent, {
            locale,
            receipt: nextReceipt,
          }),
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
          description: getTopUpErrorMessage(error, {
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

  const editTopUp = () => {
    mutation.reset()
    setStep("details")
  }

  const startAnotherTopUp = () => {
    form.reset()
    mutation.reset()
    setReceipt(null)
    setReviewAmountMinor(null)
    setStep("details")
  }

  return {
    confirmTopUp,
    editTopUp,
    form,
    locale,
    maxAmount,
    minAmount,
    mutation,
    receipt,
    reviewAmountMinor,
    selectedAmount,
    showReview,
    startAnotherTopUp,
    stateHeadingRef,
    step,
  }
}
