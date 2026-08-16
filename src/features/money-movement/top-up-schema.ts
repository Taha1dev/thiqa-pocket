import { z } from "zod"

import { parseMoneyInputToMinor } from "@/domain/money/money"
import { TOP_UP_LIMITS } from "@/domain/money-movement/money-movement"

interface TopUpValidationMessages {
  readonly amountRequired: string
  readonly amountInvalid: string
  readonly amountBelowMinimum: string
  readonly amountAboveMaximum: string
}

export interface TopUpFormValues {
  readonly amount: string
}

export function createTopUpSchema(messages: TopUpValidationMessages) {
  return z.object({
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
      if (amountMinor < TOP_UP_LIMITS.minMinor) {
        context.addIssue({
          code: "custom",
          message: messages.amountBelowMinimum,
        })
      } else if (amountMinor > TOP_UP_LIMITS.maxMinor) {
        context.addIssue({
          code: "custom",
          message: messages.amountAboveMaximum,
        })
      }
    }),
  })
}
