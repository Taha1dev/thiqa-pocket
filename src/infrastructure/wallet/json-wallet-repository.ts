import type { Transaction } from "@/domain/transaction/transaction"
import type { WalletRepository } from "@/domain/wallet/wallet-repository"
import type { WalletUser } from "@/domain/wallet/wallet"
import { DataValidationError } from "@/shared/errors/data-validation-error"
import { EntityNotFoundError } from "@/shared/errors/entity-not-found-error"
import { RequestError } from "@/shared/errors/request-error"
import {
  MOCK_REQUEST_DELAYS,
  waitForMockRequest,
  type MockRequestDelay,
} from "@/infrastructure/mock-network/mock-request-delay"
import {
  mapTransaction,
  mapWalletUser,
  walletDataDtoSchema,
  type WalletDataDto,
} from "@/infrastructure/wallet/wallet-dto"

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

  async getWallet(signal?: AbortSignal): Promise<WalletUser> {
    const data = await this.getData(signal)
    return mapWalletUser(data.user)
  }

  async getTransactions(signal?: AbortSignal): Promise<readonly Transaction[]> {
    const data = await this.getData(signal)
    return data.transactions.map(mapTransaction)
  }

  async getTransactionById(
    id: string,
    signal?: AbortSignal
  ): Promise<Transaction> {
    const transactions = await this.getTransactions(signal)
    const transaction = transactions.find((item) => item.id === id)

    if (!transaction) {
      throw new EntityNotFoundError("transaction", id)
    }

    return transaction
  }

  private async getData(signal?: AbortSignal): Promise<WalletDataDto> {
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

      return result.data
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
        {
          cause: error,
        }
      )
    }
  }
}

export const walletRepository = new JsonWalletRepository()
