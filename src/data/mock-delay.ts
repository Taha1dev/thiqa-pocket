export const MOCK_REQUEST_DELAYS = {
  query: 600,
  auth: 800,
  financialMutation: 1_200,
} as const

export type MockRequestDelay = (
  delayMs: number,
  signal?: AbortSignal
) => Promise<void>

export const waitForMockRequest: MockRequestDelay = (delayMs, signal) => {
  signal?.throwIfAborted()

  if (delayMs <= 0) {
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    const handleAbort = () => {
      globalThis.clearTimeout(timeoutId)
      reject(
        signal?.reason ??
          new DOMException("The request was aborted.", "AbortError")
      )
    }
    const timeoutId = globalThis.setTimeout(() => {
      signal?.removeEventListener("abort", handleAbort)
      resolve()
    }, delayMs)

    signal?.addEventListener("abort", handleAbort, { once: true })
  })
}
