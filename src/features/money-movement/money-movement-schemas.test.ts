import { describe, expect, it } from "vitest"

import {
  TOP_UP_LIMITS,
  TRANSFER_LIMITS,
  normalizeSaudiIban,
} from "@/domain/money-movement"
import { createTopUpSchema } from "@/features/top-up/schema"
import { createTransferSchema } from "@/features/transfer/schema"

const transferMessages = {
  recipientRequired: "recipient-required",
  recipientTooShort: "recipient-short",
  recipientTooLong: "recipient-long",
  ibanRequired: "iban-required",
  ibanInvalid: "iban-invalid",
  amountRequired: "amount-required",
  amountInvalid: "amount-invalid",
  amountBelowMinimum: "amount-minimum",
  amountAboveMaximum: "amount-maximum",
  amountExceedsBalance: "amount-balance",
  noteTooLong: "note-long",
}

const topUpMessages = {
  amountRequired: "amount-required",
  amountInvalid: "amount-invalid",
  amountBelowMinimum: "amount-minimum",
  amountAboveMaximum: "amount-maximum",
}

const validTransfer = {
  recipientName: "Ahmed Al-Harbi",
  iban: "SA0380000000608010167519",
  amount: "250",
  note: "",
}

function firstIssueMessage(
  result: ReturnType<ReturnType<typeof createTransferSchema>["safeParse"]>
): string | undefined {
  return result.success ? undefined : result.error.issues[0]?.message
}

describe("transfer schema", () => {
  const schema = createTransferSchema(transferMessages, 428_550)

  it("requires a recipient name", () => {
    expect(
      firstIssueMessage(
        schema.safeParse({ ...validTransfer, recipientName: " " })
      )
    ).toBe("recipient-required")
  })

  it("requires an IBAN", () => {
    expect(
      firstIssueMessage(schema.safeParse({ ...validTransfer, iban: "" }))
    ).toBe("iban-required")
  })

  it("rejects an invalid Saudi IBAN", () => {
    expect(
      firstIssueMessage(schema.safeParse({ ...validTransfer, iban: "SA123" }))
    ).toBe("iban-invalid")
  })

  it("accepts a spaced lowercase IBAN after normalization", () => {
    const iban = "sa03 8000 0000 6080 1016 7519"

    expect(schema.safeParse({ ...validTransfer, iban }).success).toBe(true)
    expect(normalizeSaudiIban(iban)).toBe("SA0380000000608010167519")
  })

  it("rejects an amount below the configured minimum", () => {
    expect(
      firstIssueMessage(
        schema.safeParse({
          ...validTransfer,
          amount: String(TRANSFER_LIMITS.minMinor / 100 - 0.01),
        })
      )
    ).toBe("amount-minimum")
  })

  it("rejects an amount above the configured maximum", () => {
    expect(
      firstIssueMessage(
        schema.safeParse({
          ...validTransfer,
          amount: String(TRANSFER_LIMITS.maxMinor / 100 + 0.01),
        })
      )
    ).toBe("amount-maximum")
  })

  it("rejects an amount greater than the available balance", () => {
    expect(
      firstIssueMessage(schema.safeParse({ ...validTransfer, amount: "5000" }))
    ).toBe("amount-balance")
  })
})

describe("top-up schema", () => {
  const schema = createTopUpSchema(topUpMessages)

  it("rejects invalid custom amounts", () => {
    const result = schema.safeParse({ amount: "not-a-number" })
    expect(result.success ? undefined : result.error.issues[0]?.message).toBe(
      "amount-invalid"
    )
  })

  it("enforces the configured minimum and maximum", () => {
    const below = schema.safeParse({
      amount: String(TOP_UP_LIMITS.minMinor / 100 - 0.01),
    })
    const above = schema.safeParse({
      amount: String(TOP_UP_LIMITS.maxMinor / 100 + 0.01),
    })

    expect(below.success ? undefined : below.error.issues[0]?.message).toBe(
      "amount-minimum"
    )
    expect(above.success ? undefined : above.error.issues[0]?.message).toBe(
      "amount-maximum"
    )
  })
})
