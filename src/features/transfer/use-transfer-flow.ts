import { createElement, useEffect, useMemo, useRef, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { sileo } from "sileo"

import { applyTransferReceiptToCache } from "@/data/money-movement-cache"
import type { MoneyMovementRepository } from "@/data/money-movement-repository"
import { createMoneyFromMinor, parseMoneyInputToMinor } from "@/domain/money"
import {
  TRANSFER_FIELD_LIMITS,
  TRANSFER_LIMITS,
  normalizeSaudiIban,
  type TransferCommand,
  type TransferReceipt,
} from "@/domain/money-movement"
import type { WalletUser } from "@/domain/wallet"
import { MoneyMovementToastContent } from "@/features/money-movement/components/money-movement-toast-content"
import {
  createTransferSchema,
  type TransferFormValues,
} from "@/features/transfer/schema"
import { MoneyMovementError } from "@/shared/errors/errors"
import { formatMoney } from "@/shared/formatting/format-money"

export interface TransferReviewValues {
  readonly recipientName: string
  readonly iban: string
  readonly amountMinor: number
  readonly note: string | null
}

export function getTransferErrorMessage(
  error: unknown,
  messages: Record<
    | "insufficient_balance"
    | "invalid_amount"
    | "invalid_iban"
    | "request_failed",
    string
  >
): string {
  return error instanceof MoneyMovementError
    ? messages[error.code]
    : messages.request_failed
}

export function useTransferFlow(
  wallet: WalletUser,
  repository: MoneyMovementRepository
) {
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

  const form = useForm<TransferFormValues>({
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

  const showReview = form.handleSubmit((values) => {
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
        loading: { title: t("transfer.notifications.pending.title") },
        success: (nextReceipt) => ({
          title: t("transfer.notifications.success.title"),
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
          title: t("transfer.notifications.failed.title"),
          description: getTransferErrorMessage(error, {
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

  const editTransfer = () => {
    mutation.reset()
    setStep("details")
  }

  const startAnotherTransfer = () => {
    form.reset()
    mutation.reset()
    setReceipt(null)
    setReviewValues(null)
    setStep("details")
  }

  return {
    confirmTransfer,
    editTransfer,
    form,
    locale,
    maxAmount,
    minAmount,
    mutation,
    receipt,
    reviewValues,
    showReview,
    startAnotherTransfer,
    stateHeadingRef,
    step,
  }
}
