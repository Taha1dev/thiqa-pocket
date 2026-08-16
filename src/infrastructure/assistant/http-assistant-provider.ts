import { z } from "zod"

import type {
  AssistantProvider,
  AssistantRequest,
  AssistantResponse,
} from "@/domain/assistant/assistant-provider"
import { RequestError } from "@/shared/errors/request-error"

const assistantResponseSchema = z.object({
  answer: z.string().min(1),
})

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError"
}

function normalizeLocale(locale: string): "en" | "ar" {
  return locale.toLowerCase().startsWith("ar") ? "ar" : "en"
}

export function createHttpAssistantProvider(
  endpoint = "/api/assistant"
): AssistantProvider {
  return {
    async ask(
      request: AssistantRequest,
      signal?: AbortSignal
    ): Promise<AssistantResponse> {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          signal,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question: request.question,
            locale: normalizeLocale(request.locale),
            wallet: {
              balanceMinor: request.wallet.balance.amountMinor,
              currency: request.wallet.balance.currency,
            },
            transactions: request.transactions.map((transaction) => ({
              type: transaction.type,
              category: transaction.category,
              amountMinor: transaction.amount.amountMinor,
              currency: transaction.amount.currency,
              status: transaction.status,
              timestamp: transaction.timestamp,
              counterpartyName: transaction.counterpartyName,
            })),
          }),
        })

        if (!response.ok) {
          throw new RequestError("The assistant request failed.", {
            status: response.status,
          })
        }

        const payload: unknown = await response.json()
        const parsedResponse = assistantResponseSchema.safeParse(payload)

        if (!parsedResponse.success) {
          throw new RequestError("The assistant returned an invalid response.")
        }

        return parsedResponse.data
      } catch (error) {
        if (error instanceof RequestError || isAbortError(error)) {
          throw error
        }

        throw new RequestError(
          "The assistant request could not be completed.",
          {
            cause: error,
          }
        )
      }
    },
  }
}

export const assistantProvider = createHttpAssistantProvider()
