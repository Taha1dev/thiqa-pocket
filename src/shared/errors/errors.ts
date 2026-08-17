export class DataValidationError extends Error {
  readonly issues: readonly string[]

  constructor(issues: readonly string[]) {
    super("The wallet data response failed validation.")
    this.name = "DataValidationError"
    this.issues = issues
  }
}

export class EntityNotFoundError extends Error {
  readonly entity: string
  readonly id: string

  constructor(entity: string, id: string) {
    super(`${entity} with id "${id}" was not found.`)
    this.name = "EntityNotFoundError"
    this.entity = entity
    this.id = id
  }
}

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

export class RequestError extends Error {
  readonly status: number | null

  constructor(
    message: string,
    options?: ErrorOptions & { readonly status?: number }
  ) {
    super(message, options)
    this.name = "RequestError"
    this.status = options?.status ?? null
  }
}
