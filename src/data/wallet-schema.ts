import { z } from "zod"

import { createMoney } from "@/domain/money"
import {
  transactionCategories,
  transactionStatuses,
  transactionTypes,
  type Transaction,
} from "@/domain/transaction"
import type { WalletData, WalletUser } from "@/domain/wallet"

const decimalAmountSchema = z
  .number()
  .finite()
  .nonnegative()
  .refine(
    (amount) => Math.abs(amount * 100 - Math.round(amount * 100)) < 0.000001,
    "Money values must have at most two decimal places."
  )

const walletUserDtoSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    phone: z.string().min(1),
    walletBalance: decimalAmountSchema,
    currency: z.literal("SAR"),
  })
  .strict()

const transactionDtoSchema = z
  .object({
    id: z.string().min(1),
    type: z.enum(transactionTypes),
    category: z.enum(transactionCategories),
    amount: decimalAmountSchema,
    counterpartyName: z.string().min(1),
    counterpartyAccount: z.string().min(1).nullable(),
    status: z.enum(transactionStatuses),
    timestamp: z.string().datetime({ offset: true }),
    note: z.string().min(1).nullable(),
  })
  .strict()

export const walletDataDtoSchema = z
  .object({
    user: walletUserDtoSchema,
    transactions: z.array(transactionDtoSchema),
  })
  .strict()

export type WalletDataDto = z.infer<typeof walletDataDtoSchema>
type TransactionDto = z.infer<typeof transactionDtoSchema>

export function mapWalletUser(dto: WalletDataDto["user"]): WalletUser {
  return {
    id: dto.id,
    name: dto.name,
    phone: dto.phone,
    balance: createMoney(dto.walletBalance, dto.currency),
  }
}

export function mapTransaction(dto: TransactionDto): Transaction {
  return {
    id: dto.id,
    type: dto.type,
    category: dto.category,
    amount: createMoney(dto.amount, "SAR"),
    counterpartyName: dto.counterpartyName,
    counterpartyAccount: dto.counterpartyAccount,
    status: dto.status,
    timestamp: dto.timestamp,
    note: dto.note,
  }
}

export function mapWalletData(dto: WalletDataDto): WalletData {
  return {
    wallet: mapWalletUser(dto.user),
    transactions: dto.transactions.map(mapTransaction),
  }
}
