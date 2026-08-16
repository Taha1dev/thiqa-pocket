export type MoneyMovementErrorCode =
  "insufficient_balance" | "invalid_amount" | "invalid_iban" | "request_failed"

export class MoneyMovementError extends Error {
  readonly code: MoneyMovementErrorCode

  constructor(code: MoneyMovementErrorCode, options?: ErrorOptions) {
    super(code, options)
    this.name = "MoneyMovementError"
    this.code = code
  }
}
