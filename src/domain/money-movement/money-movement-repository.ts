import type {
  TopUpCommand,
  TopUpReceipt,
  TransferCommand,
  TransferReceipt,
} from "@/domain/money-movement/money-movement"

export interface MoneyMovementRepository {
  transfer(
    command: TransferCommand,
    signal?: AbortSignal
  ): Promise<TransferReceipt>
  topUp(command: TopUpCommand, signal?: AbortSignal): Promise<TopUpReceipt>
}
