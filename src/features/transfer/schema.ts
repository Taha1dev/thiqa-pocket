import { z } from "zod"

import { parseMoneyInputToMinor } from "@/domain/money"
import {
  SAUDI_IBAN_PATTERN,
  TRANSFER_FIELD_LIMITS,
  TRANSFER_LIMITS,
  normalizeSaudiIban,
} from "@/domain/money-movement"

interface TransferValidationMessages {
  readonly recipientRequired: string
  readonly recipientTooShort: string
  readonly recipientTooLong: string
  readonly ibanRequired: string
  readonly ibanInvalid: string
  readonly amountRequired: string
  readonly amountInvalid: string
  readonly amountBelowMinimum: string
  readonly amountAboveMaximum: string
  readonly amountExceedsBalance: string
  readonly noteTooLong: string
}

export interface TransferFormValues {
  readonly recipientName: string
  readonly iban: string
  readonly amount: string
  readonly note: string
}

export function createTransferSchema(
  messages: TransferValidationMessages,
  availableBalanceMinor: number
) {
  return z.object({
    recipientName: z.string().superRefine((value, context) => {
      const trimmedValue = value.trim()
      if (!trimmedValue) {
        context.addIssue({
          code: "custom",
          message: messages.recipientRequired,
        })
        return
      }
      if (trimmedValue.length < TRANSFER_FIELD_LIMITS.recipientNameMin) {
        context.addIssue({
          code: "custom",
          message: messages.recipientTooShort,
        })
      }
      if (trimmedValue.length > TRANSFER_FIELD_LIMITS.recipientNameMax) {
        context.addIssue({ code: "custom", message: messages.recipientTooLong })
      }
    }),
    iban: z.string().superRefine((value, context) => {
      const normalizedIban = normalizeSaudiIban(value)
      if (!normalizedIban) {
        context.addIssue({ code: "custom", message: messages.ibanRequired })
        return
      }
      if (!SAUDI_IBAN_PATTERN.test(normalizedIban)) {
        context.addIssue({ code: "custom", message: messages.ibanInvalid })
      }
    }),
    amount: z.string().superRefine((value, context) => {
      if (!value.trim()) {
        context.addIssue({ code: "custom", message: messages.amountRequired })
        return
      }

      const amountMinor = parseMoneyInputToMinor(value)
      if (amountMinor === null) {
        context.addIssue({ code: "custom", message: messages.amountInvalid })
        return
      }
      if (amountMinor < TRANSFER_LIMITS.minMinor) {
        context.addIssue({
          code: "custom",
          message: messages.amountBelowMinimum,
        })
      } else if (amountMinor > TRANSFER_LIMITS.maxMinor) {
        context.addIssue({
          code: "custom",
          message: messages.amountAboveMaximum,
        })
      } else if (amountMinor > availableBalanceMinor) {
        context.addIssue({
          code: "custom",
          message: messages.amountExceedsBalance,
        })
      }
    }),
    note: z.string().trim().max(TRANSFER_FIELD_LIMITS.noteMax, {
      message: messages.noteTooLong,
    }),
  })
}
