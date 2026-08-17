import type { WalletData } from "@/domain/wallet"
import { mapWalletData, walletDataDtoSchema } from "@/data/wallet-schema"
import {
  MOCK_REQUEST_DELAYS,
  waitForMockRequest,
  type MockRequestDelay,
} from "@/data/mock-delay"
import { DataValidationError, RequestError } from "@/shared/errors"

export interface WalletRepository {
  getWalletData(signal?: AbortSignal): Promise<WalletData>
}

interface JsonWalletRepositoryOptions {
  readonly url?: string
  readonly delayMs?: number
  readonly requestDelay?: MockRequestDelay
  readonly fetcher?: typeof fetch
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError"
}

export class JsonWalletRepository implements WalletRepository {
  private readonly url: string
  private readonly delayMs: number
  private readonly requestDelay: MockRequestDelay
  private readonly fetcher: typeof fetch

  constructor({
    url = "/mock_data.json",
    delayMs = MOCK_REQUEST_DELAYS.query,
    requestDelay = waitForMockRequest,
    fetcher = globalThis.fetch,
  }: JsonWalletRepositoryOptions = {}) {
    this.url = url
    this.delayMs = delayMs
    this.requestDelay = requestDelay
    this.fetcher = fetcher.bind(globalThis)
  }

  async getWalletData(signal?: AbortSignal): Promise<WalletData> {
    try {
      await this.requestDelay(this.delayMs, signal)
      const response = await this.fetcher(this.url, { signal })

      if (!response.ok) {
        throw new RequestError("The wallet data request failed.", {
          status: response.status,
        })
      }

      const payload: unknown = await response.json()
      const result = walletDataDtoSchema.safeParse(payload)

      if (!result.success) {
        throw new DataValidationError(
          result.error.issues.map((issue) => issue.message)
        )
      }

      return mapWalletData(result.data)
    } catch (error) {
      if (
        error instanceof RequestError ||
        error instanceof DataValidationError ||
        isAbortError(error)
      ) {
        throw error
      }

      throw new RequestError(
        "The wallet data request could not be completed.",
        { cause: error }
      )
    }
  }
}

export const walletRepository = new JsonWalletRepository()
