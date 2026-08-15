import type { Transaction } from "@/domain/transaction/transaction"
import type { WalletRepository } from "@/domain/wallet/wallet-repository"
import type { WalletUser } from "@/domain/wallet/wallet"
import { DataValidationError } from "@/shared/errors/data-validation-error"
import { EntityNotFoundError } from "@/shared/errors/entity-not-found-error"
import { RequestError } from "@/shared/errors/request-error"
import {
  mapTransaction,
  mapWalletUser,
  walletDataDtoSchema,
  type WalletDataDto,
} from "@/infrastructure/wallet/wallet-dto"

interface JsonWalletRepositoryOptions {
  readonly url?: string
  readonly delayMs?: number
  readonly fetcher?: typeof fetch
}

function waitForDelay(delayMs: number, signal?: AbortSignal): Promise<void> {
  signal?.throwIfAborted()

  if (delayMs <= 0) {
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    const handleAbort = () => {
      window.clearTimeout(timeoutId)
      reject(
        signal?.reason ??
          new DOMException("The request was aborted.", "AbortError")
      )
    }
    const timeoutId = window.setTimeout(() => {
      signal?.removeEventListener("abort", handleAbort)
      resolve()
    }, delayMs)

    signal?.addEventListener("abort", handleAbort, { once: true })
  })
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError"
}

export class JsonWalletRepository implements WalletRepository {
  private readonly url: string
  private readonly delayMs: number
  private readonly fetcher: typeof fetch

  constructor({
    url = "/mock_data.json",
    delayMs = 600,
    fetcher = globalThis.fetch,
  }: JsonWalletRepositoryOptions = {}) {
    this.url = url
    this.delayMs = delayMs
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
      await waitForDelay(this.delayMs, signal)
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
