import { createMoneyFromMinor } from "@/domain/money"
import {
  SAUDI_IBAN_PATTERN,
  TOP_UP_LIMITS,
  TRANSFER_LIMITS,
  normalizeSaudiIban,
  type TopUpCommand,
  type TopUpReceipt,
  type TransferCommand,
  type TransferReceipt,
} from "@/domain/money-movement"
import {
  MOCK_REQUEST_DELAYS,
  waitForMockRequest,
  type MockRequestDelay,
} from "@/data/mock-delay"
import { MoneyMovementError } from "@/shared/errors"

export interface MoneyMovementRepository {
  transfer(
    command: TransferCommand,
    signal?: AbortSignal
  ): Promise<TransferReceipt>
  topUp(command: TopUpCommand, signal?: AbortSignal): Promise<TopUpReceipt>
}

interface MockMoneyMovementRepositoryOptions {
  readonly delayMs?: number
  readonly requestDelay?: MockRequestDelay
  readonly createId?: () => string
  readonly now?: () => Date
}

function defaultCreateId(): string {
  const randomSegment = globalThis.crypto.randomUUID().replaceAll("-", "")
  return `txn_${randomSegment.slice(0, 16)}`
}

function hasValidCurrency(command: TransferCommand | TopUpCommand): boolean {
  return (
    command.amount.currency === "SAR" &&
    command.currentBalance.currency === command.amount.currency
  )
}

export class MockMoneyMovementRepository implements MoneyMovementRepository {
  private readonly delayMs: number
  private readonly requestDelay: MockRequestDelay
  private readonly createId: () => string
  private readonly now: () => Date

  constructor({
    delayMs = MOCK_REQUEST_DELAYS.financialMutation,
    requestDelay = waitForMockRequest,
    createId = defaultCreateId,
    now = () => new Date(),
  }: MockMoneyMovementRepositoryOptions = {}) {
    this.delayMs = delayMs
    this.requestDelay = requestDelay
    this.createId = createId
    this.now = now
  }

  async transfer(
    command: TransferCommand,
    signal?: AbortSignal
  ): Promise<TransferReceipt> {
    await this.requestDelay(this.delayMs, signal)

    if (
      !hasValidCurrency(command) ||
      !Number.isSafeInteger(command.amount.amountMinor) ||
      command.amount.amountMinor < TRANSFER_LIMITS.minMinor ||
      command.amount.amountMinor > TRANSFER_LIMITS.maxMinor
    ) {
      throw new MoneyMovementError("invalid_amount")
    }

    const iban = normalizeSaudiIban(command.iban)
    if (!SAUDI_IBAN_PATTERN.test(iban)) {
      throw new MoneyMovementError("invalid_iban")
    }

    if (command.amount.amountMinor > command.currentBalance.amountMinor) {
      throw new MoneyMovementError("insufficient_balance")
    }

    return {
      kind: "transfer",
      transactionId: this.createId(),
      status: "completed",
      amount: command.amount,
      balanceAfter: createMoneyFromMinor(
        command.currentBalance.amountMinor - command.amount.amountMinor,
        command.amount.currency
      ),
      recipientName: command.recipientName.trim(),
      iban,
      note: command.note?.trim() || null,
      timestamp: this.now().toISOString(),
    }
  }

  async topUp(
    command: TopUpCommand,
    signal?: AbortSignal
  ): Promise<TopUpReceipt> {
    await this.requestDelay(this.delayMs, signal)

    if (
      !hasValidCurrency(command) ||
      !Number.isSafeInteger(command.amount.amountMinor) ||
      command.amount.amountMinor < TOP_UP_LIMITS.minMinor ||
      command.amount.amountMinor > TOP_UP_LIMITS.maxMinor
    ) {
      throw new MoneyMovementError("invalid_amount")
    }

    const balanceAfterMinor =
      command.currentBalance.amountMinor + command.amount.amountMinor
    if (!Number.isSafeInteger(balanceAfterMinor)) {
      throw new MoneyMovementError("invalid_amount")
    }

    return {
      kind: "top_up",
      transactionId: this.createId(),
      status: "completed",
      amount: command.amount,
      balanceAfter: createMoneyFromMinor(
        balanceAfterMinor,
        command.amount.currency
      ),
      source: command.source,
      timestamp: this.now().toISOString(),
    }
  }
}

export const moneyMovementRepository = new MockMoneyMovementRepository()
