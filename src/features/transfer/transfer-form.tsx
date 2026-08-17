import type { FormEventHandler, RefObject } from "react"
import type {
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
} from "react-hook-form"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { TRANSFER_FIELD_LIMITS, formatSaudiIban } from "@/domain/money-movement"
import type { WalletUser } from "@/domain/wallet"
import type { TransferFormValues } from "@/features/transfer/schema"
import { formatMoney } from "@/shared/formatting/format-money"

interface TransferFormProps {
  readonly errors: FieldErrors<TransferFormValues>
  readonly headingRef: RefObject<HTMLHeadingElement | null>
  readonly locale: string
  readonly maxAmount: string
  readonly minAmount: string
  readonly onSubmit: FormEventHandler<HTMLFormElement>
  readonly register: UseFormRegister<TransferFormValues>
  readonly setValue: UseFormSetValue<TransferFormValues>
  readonly wallet: WalletUser
}

export function TransferForm({
  errors,
  headingRef,
  locale,
  maxAmount,
  minAmount,
  onSubmit,
  register,
  setValue,
  wallet,
}: TransferFormProps) {
  const { t } = useTranslation(["transfer", "common"])

  return (
    <div className="animate-in duration-150 fade-in motion-reduce:animate-none">
      <header>
        <h2
          className="scroll-mt-20 text-xl font-semibold tracking-[-0.02em] outline-none"
          ref={headingRef}
          tabIndex={-1}
        >
          {t("transfer.details.title")}
        </h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {t("transfer.details.description")}
        </p>
      </header>

      <form className="mt-7" noValidate onSubmit={onSubmit}>
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
                className="pointer-events-none absolute inset-y-0 inset-e-3 flex items-center text-xs font-medium text-muted-foreground"
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
  )
}
