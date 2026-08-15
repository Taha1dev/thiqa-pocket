export class DataValidationError extends Error {
  readonly issues: readonly string[]

  constructor(issues: readonly string[]) {
    super("The wallet data response failed validation.")
    this.name = "DataValidationError"
    this.issues = issues
  }
}
