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
import { createMoneyFromMinor } from "@/domain/money"
import { TOP_UP_PRESETS_MINOR } from "@/domain/money-movement"
import type { TopUpFormValues } from "@/features/top-up/schema"
import { cn } from "@/lib/utils"
import { formatMoney } from "@/shared/formatting/format-money"

interface TopUpFormProps {
  readonly errors: FieldErrors<TopUpFormValues>
  readonly headingRef: RefObject<HTMLHeadingElement | null>
  readonly locale: string
  readonly maxAmount: string
  readonly minAmount: string
  readonly onSubmit: FormEventHandler<HTMLFormElement>
  readonly register: UseFormRegister<TopUpFormValues>
  readonly selectedAmount: string
  readonly setValue: UseFormSetValue<TopUpFormValues>
}

export function TopUpForm({
  errors,
  headingRef,
  locale,
  maxAmount,
  minAmount,
  onSubmit,
  register,
  selectedAmount,
  setValue,
}: TopUpFormProps) {
  const { t } = useTranslation(["transfer", "common"])

  return (
    <div className="animate-in duration-150 fade-in motion-reduce:animate-none">
      <header>
        <h2
          className="scroll-mt-20 text-xl font-semibold tracking-[-0.02em] outline-none"
          ref={headingRef}
          tabIndex={-1}
        >
          {t("topUp.details.title")}
        </h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {t("topUp.details.description")}
        </p>
      </header>

      <form className="mt-7" noValidate onSubmit={onSubmit}>
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
                  errors.amount ? "top-up-amount-error" : "top-up-amount-helper"
                }
                aria-invalid={Boolean(errors.amount)}
                placeholder={t("topUp.fields.amount.placeholder")}
                {...register("amount")}
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 inset-e-3 flex items-center text-xs font-medium text-muted-foreground"
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
  )
}
