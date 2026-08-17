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

interface SharedDataRequest {
  readonly controller: AbortController
  readonly promise: Promise<WalletDataDto>
  consumers: number
  settled: boolean
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError"
}

export class JsonWalletRepository implements WalletRepository {
  private readonly url: string
  private readonly delayMs: number
  private readonly requestDelay: MockRequestDelay
  private readonly fetcher: typeof fetch
  private dataRequest?: SharedDataRequest

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
    signal?.throwIfAborted()

    const request = this.dataRequest ?? this.createDataRequest()
    request.consumers += 1

    return new Promise((resolve, reject) => {
      let released = false

      const release = () => {
        if (released) {
          return
        }

        released = true
        signal?.removeEventListener("abort", handleAbort)
        request.consumers -= 1

        if (request.consumers === 0 && !request.settled) {
          if (this.dataRequest === request) {
            this.dataRequest = undefined
          }
          request.controller.abort()
        }
      }

      const handleAbort = () => {
        release()
        reject(
          signal?.reason ??
            new DOMException("The request was aborted.", "AbortError")
        )
      }

      signal?.addEventListener("abort", handleAbort, { once: true })
      request.promise.then(
        (data) => {
          if (!released) {
            release()
            resolve(data)
          }
        },
        (error: unknown) => {
          if (!released) {
            release()
            reject(error)
          }
        }
      )
    })
  }

  private createDataRequest(): SharedDataRequest {
    const controller = new AbortController()
    const request: SharedDataRequest = {
      controller,
      promise: this.fetchData(controller.signal),
      consumers: 0,
      settled: false,
    }

    this.dataRequest = request
    request.promise.then(
      () => this.releaseDataRequest(request),
      () => this.releaseDataRequest(request)
    )

    return request
  }

  private releaseDataRequest(request: SharedDataRequest): void {
    request.settled = true
    if (this.dataRequest === request) {
      this.dataRequest = undefined
    }
  }

  private async fetchData(signal: AbortSignal): Promise<WalletDataDto> {
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
