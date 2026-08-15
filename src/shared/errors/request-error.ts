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
